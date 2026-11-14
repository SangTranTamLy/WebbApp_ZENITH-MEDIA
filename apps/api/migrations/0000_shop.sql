CREATE SCHEMA "shop";
--> statement-breakpoint
CREATE TABLE "shop"."accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."audit" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."carts" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."categories" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."downloads" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"entitlement_id" text GENERATED ALWAYS AS (payload->>'entitlementId') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"user_id" text GENERATED ALWAYS AS (payload->>'userId') STORED NOT NULL,
	"offer_id" text GENERATED ALWAYS AS (payload->>'offerId') STORED NOT NULL,
	"order_id" text GENERATED ALWAYS AS (payload->>'orderId') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."files" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."guard" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"file_id" text GENERATED ALWAYS AS (payload->>'fileId') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."offers" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"product_id" text GENERATED ALWAYS AS (payload->>'productId') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."orders" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"user_id" text GENERATED ALWAYS AS (payload->>'userId') STORED NOT NULL,
	"idempotency_key" text GENERATED ALWAYS AS (payload->>'idempotencyKey') STORED NOT NULL,
	CONSTRAINT "order_nonnegative" CHECK (("shop"."orders"."payload"->>'totalVnd')::bigint >= 0)
);
--> statement-breakpoint
CREATE TABLE "shop"."outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."payments" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"order_id" text GENERATED ALWAYS AS (payload->>'orderId') STORED NOT NULL,
	"bank_reference" text GENERATED ALWAYS AS (payload->>'bankReference') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."products" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."settings" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."ticketMessages" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"ticket_id" text GENERATED ALWAYS AS (payload->>'ticketId') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"order_id" text GENERATED ALWAYS AS (payload->>'orderId') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop"."wishlists" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shop"."carts" ADD CONSTRAINT "carts_id_accounts_id_fk" FOREIGN KEY ("id") REFERENCES "shop"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."downloads" ADD CONSTRAINT "downloads_entitlement_id_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "shop"."entitlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."entitlements" ADD CONSTRAINT "entitlements_user_id_accounts_id_fk" FOREIGN KEY ("user_id") REFERENCES "shop"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."entitlements" ADD CONSTRAINT "entitlements_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "shop"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."entitlements" ADD CONSTRAINT "entitlements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "shop"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."jobs" ADD CONSTRAINT "jobs_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "shop"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."offers" ADD CONSTRAINT "offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "shop"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."orders" ADD CONSTRAINT "orders_user_id_accounts_id_fk" FOREIGN KEY ("user_id") REFERENCES "shop"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "shop"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."ticketMessages" ADD CONSTRAINT "ticketMessages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "shop"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "shop"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop"."wishlists" ADD CONSTRAINT "wishlists_id_accounts_id_fk" FOREIGN KEY ("id") REFERENCES "shop"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_code" ON "shop"."coupons" USING btree (("payload"->>'code'));--> statement-breakpoint
CREATE UNIQUE INDEX "owned_offer" ON "shop"."entitlements" USING btree ("user_id","offer_id");--> statement-breakpoint
CREATE INDEX "library_user" ON "shop"."entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "file_object_key" ON "shop"."files" USING btree (("payload"->>'bucket'),("payload"->>'key'));--> statement-breakpoint
CREATE INDEX "queue_status" ON "shop"."jobs" USING btree (("payload"->>'status'));--> statement-breakpoint
CREATE INDEX "notification_user" ON "shop"."notifications" USING btree (("payload"->>'userId'));--> statement-breakpoint
CREATE UNIQUE INDEX "order_request" ON "shop"."orders" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "outbox_status" ON "shop"."outbox" USING btree (("payload"->>'status'));--> statement-breakpoint
CREATE UNIQUE INDEX "payment_order" ON "shop"."payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_reference" ON "shop"."payments" USING btree ("bank_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug" ON "shop"."products" USING btree (("payload"->'published'->>'slug'));--> statement-breakpoint
CREATE INDEX "ticket_user" ON "shop"."tickets" USING btree (("payload"->>'userId'));