import { Link } from "react-router-dom";
import { localized } from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { PageHead, Empty, ErrorState } from "../components/Primitives";
export function Information({ page }: { page: "faq" | "license" | "refund" }) {
  const { t, locale, settings, catalogError, reloadConfig } = useShop();
  return (
    <div className="container information-page">
      <PageHead
        title={
          page === "faq"
            ? t("Câu hỏi thường gặp", "Frequently asked questions")
            : page === "license"
              ? t("Giấy phép & điều khoản", "License & terms")
              : t("Chính sách hoàn tiền", "Refund policy")
        }
      />
      {catalogError ? (
        <ErrorState message={catalogError} retry={() => void reloadConfig()} />
      ) : (
        settings && (
          <>
            {page === "faq" ? (
              <div className="faq-list">
                {settings.faq.map((item, i) => (
                  <details key={i}>
                    <summary>{localized(item.question, locale)}</summary>
                    <p>{localized(item.answer, locale)}</p>
                  </details>
                ))}
              </div>
            ) : (
              <div className="prose">
                <p className="preserve-lines">
                  {localized(
                    page === "license" ? settings.license : settings.refund,
                    locale,
                  )}
                </p>
                {!settings.legalReviewed && (
                  <p className="notice-box">
                    {t(
                      "Điều khoản đang được rà soát trước khi mở bán.",
                      "Terms are being reviewed before sales open.",
                    )}
                  </p>
                )}
                <p>
                  {t("Phiên bản điều khoản:", "Terms version:")}{" "}
                  {settings.termsVersion}
                </p>
              </div>
            )}
            <Link className="button secondary" to="/support">
              {t("Liên hệ hỗ trợ", "Contact support")}
            </Link>
          </>
        )
      )}
    </div>
  );
}
export function NotFound() {
  const { t } = useShop();
  return (
    <div className="container">
      <Empty
        title={t("Không tìm thấy trang", "Page not found")}
        body={t(
          "Trang này không còn tồn tại hoặc địa chỉ chưa chính xác.",
          "This page may have moved or the address may be incorrect.",
        )}
        href="/shop"
        label={t("Trở về cửa hàng", "Back to the store")}
      />
    </div>
  );
}
