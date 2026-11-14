INSERT INTO shop.guard (id) VALUES ('commerce') ON CONFLICT DO NOTHING;

-- Shop is deliberately not exposed through Supabase Data API. Express validates
-- Supabase identity and object ownership before every access. RLS is deny-by-default.
DO $$ DECLARE t record; r text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='shop' LOOP
    EXECUTE format('ALTER TABLE shop.%I ENABLE ROW LEVEL SECURITY',t.tablename);
    EXECUTE format('REVOKE ALL ON shop.%I FROM PUBLIC',t.tablename);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
        EXECUTE format('REVOKE ALL ON shop.%I FROM %I',t.tablename,r);
      END IF;
    END LOOP;
  END LOOP;
  REVOKE ALL ON SCHEMA shop FROM PUBLIC;
END $$;

CREATE FUNCTION shop.prevent_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Immutable commerce record: %',TG_TABLE_NAME; END $$;
CREATE TRIGGER immutable_offer BEFORE UPDATE OR DELETE ON shop.offers FOR EACH ROW EXECUTE FUNCTION shop.prevent_mutation();
CREATE TRIGGER immutable_entitlement BEFORE UPDATE OR DELETE ON shop.entitlements FOR EACH ROW EXECUTE FUNCTION shop.prevent_mutation();
CREATE TRIGGER immutable_payment BEFORE UPDATE OR DELETE ON shop.payments FOR EACH ROW EXECUTE FUNCTION shop.prevent_mutation();
CREATE TRIGGER append_only_audit BEFORE UPDATE OR DELETE ON shop.audit FOR EACH ROW EXECUTE FUNCTION shop.prevent_mutation();

CREATE FUNCTION shop.protect_order_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (OLD.payload - ARRAY['status','notes','reportedAt','paidAt']) IS DISTINCT FROM (NEW.payload - ARRAY['status','notes','reportedAt','paidAt']) THEN
   RAISE EXCEPTION 'Order snapshot cannot change';
 END IF;
 IF OLD.payload->>'status'='paid' AND NEW.payload->>'status'<>'paid' THEN RAISE EXCEPTION 'Paid order cannot be reverted'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_order_snapshot BEFORE UPDATE ON shop.orders FOR EACH ROW EXECUTE FUNCTION shop.protect_order_snapshot();
