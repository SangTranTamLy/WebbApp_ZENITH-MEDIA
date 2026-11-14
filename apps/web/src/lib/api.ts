let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details: unknown,
  ) {
    super(message);
  }
}
export async function api<T>(
  route: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${import.meta.env.VITE_SHOP_API_URL ?? ""}/api${route}`,
    {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    },
  );
  const data = await response.json().catch(() => ({
    error: { code: "CONNECTION", message: "Không kết nối được máy chủ." },
  }));
  if (!response.ok)
    throw new ApiError(
      data.error?.code ?? "REQUEST_FAILED",
      data.error?.message ?? "Yêu cầu thất bại.",
      data.error?.details,
    );
  return data as T;
}
export const post = <T>(route: string, body: unknown = {}) =>
  api<T>(route, { method: "POST", body: JSON.stringify(body) });
export const put = <T>(route: string, body: unknown) =>
  api<T>(route, { method: "PUT", body: JSON.stringify(body) });
export const patch = <T>(route: string, body: unknown) =>
  api<T>(route, { method: "PATCH", body: JSON.stringify(body) });
const english: Record<string, string> = {
  ALREADY_OWNED: "You already own this option. Open My Library to download it.",
  CART_OVERLAP:
    "These items contain overlapping content. Remove one before checkout.",
  INVALID_COUPON: "This coupon is invalid or has expired.",
  COUPON_STACKING: "This coupon cannot be combined with ownership credits.",
  COUPON_CONDITIONS: "Your cart does not meet this coupon’s conditions.",
  COUPON_LIMIT: "This coupon has reached its usage limit.",
  EMAIL_UNVERIFIED: "Verify your email before checkout.",
  ORDER_PENDING: "You already have an open order for this content.",
  ORDER_EXPIRED:
    "This order has expired. If you transferred money, create a support ticket.",
  CHECKOUT_DISABLED: "Checkout is not open yet.",
  FILE_UNAVAILABLE: "This file is being restored. Please try again later.",
  UNAUTHENTICATED: "Please sign in.",
  INVALID_TOKEN: "Your session expired. Please sign in again.",
  PREVIEW_NOT_READY:
    "Video previews must finish watermark processing before publication.",
  ACCOUNT_BLOCKED: "This account is suspended. Please contact the store.",
  ACCOUNT_DELETED: "This account has been deleted and cannot be reactivated.",
  ADMIN_SELF_BLOCK: "You cannot suspend your own admin account.",
  ADMIN_DELETE: "The store administrator cannot request account deletion here.",
  AUTH_ADMIN_NOT_CONFIGURED:
    "Account deletion is not configured. Please contact the store.",
  AUTH_DELETE_FAILED:
    "The authentication provider could not delete the account. Please retry.",
  CHALLENGE_EXPIRED:
    "The confirmation request has expired. Please start again.",
  EMAIL_FAILED: "The verification email could not be sent. Please retry.",
  INVALID_OTP: "The verification code is invalid or has expired.",
  NO_DELETION_REQUEST:
    "The customer has not confirmed an account deletion request.",
  PASSWORD_INVALID: "Your current password is incorrect.",
  CATEGORY_HIDDEN: "The product category is hidden.",
  COMPATIBILITY_REQUIRED: "Specify the supported After Effects version.",
  CONTENT_REQUIRED: "Complete the Vietnamese and English product content.",
  DRAFT_CONFLICT: "This draft has changed. Reload before saving.",
  DUPLICATE_COMPONENT: "The bundle contains duplicate ownership rights.",
  DUPLICATE_OPTION: "Publish only one price for each quality and release.",
  DUPLICATE_CART: "This option appears more than once in your cart.",
  EMPTY_CART: "Choose between 1 and 30 assets for checkout.",
  EMPTY_BUNDLE: "Add the bundle components before publishing.",
  FILES_NOT_READY: "All included files must be validated and ready.",
  IMMUTABLE_OFFER:
    "Saved options cannot be changed. Create a new option instead.",
  INVALID_CATEGORY: "The selected category does not exist.",
  INVALID_COMPONENT: "Choose an independent asset as a bundle component.",
  INVALID_FILE: "The file is unavailable or has the wrong purpose.",
  INVALID_OFFER: "A purchase option does not belong to this product.",
  INVALID_UPGRADE: "Upgrades must be between options of the same product.",
  README_REQUIRED: "Add bilingual instructions and an included README file.",
  ZIP_INVALID: "The bundle ZIP must pass validation before publication.",
  ZIP_MISSING_COMPONENT: "The ZIP is missing an included component file.",
  ZIP_WARNINGS: "Review and acknowledge the ZIP warnings before continuing.",
  BANK_NOT_CONFIGURED: "Bank transfer details have not been configured.",
  IDEMPOTENCY_CONFLICT:
    "This checkout request was already used for a different cart.",
  OWNERSHIP_CHANGED:
    "The customer already owns this content. Reconcile the payment before continuing.",
  PAYMENT_EXCEPTION:
    "The payment amount or timing differs. Confirm the exception and document the resolution.",
  REFERENCE_USED:
    "This bank transaction reference was already used for another order.",
  TERMS_CHANGED:
    "The terms have changed. Reload, read and accept the current version.",
  OFFER_UNAVAILABLE: "This purchase option is no longer available.",
  PRODUCT_UNAVAILABLE: "This product is no longer available for purchase.",
  DOWNLOAD_RATE_LIMIT:
    "Too many download requests. Please wait a minute and retry.",
  FILE_REFERENCED:
    "This file is still referenced by a product, order, ticket or job and cannot be deleted.",
  FILE_TOO_LARGE: "This file exceeds the upload limit.",
  INVALID_ATTACHMENT:
    "Check the attachment type, ownership and validation status.",
  INVALID_FILENAME: "This filename is not supported.",
  INVALID_PREVIEW_SOURCE:
    "Choose a validated video file as the preview source.",
  LEASE_LOST:
    "Another worker now owns this job. Its result cannot be replaced.",
  OBJECT_MISSING: "The uploaded object could not be found in storage.",
  OUTPUT_INVALID: "The preview output is invalid or incomplete.",
  RESTORE_MISMATCH:
    "The backup does not match the original file size and checksum.",
  SOURCE_NOT_READY: "Finish uploading the source before creating a job.",
  UPLOAD_CONFLICT: "Another request has already completed this upload.",
  UPLOAD_MISMATCH:
    "The uploaded size or content type differs from the expected file.",
  EMPTY_MESSAGE: "Enter a support message or attach a file.",
  TICKET_CLOSED: "Reopen the ticket before replying.",
  INVALID_JSON: "The request is not valid JSON.",
  INVALID_OUTBOX: "Only failed deliveries can be retried.",
  INVALID_PARENT:
    "Categories support only two levels without circular relationships.",
  JOB_NOT_FAILED: "Only failed preview jobs can be retried.",
  ORDER_PAID: "This order is already paid.",
  VALIDATION: "Please check the form fields.",
  NOT_FOUND: "The requested item was not found.",
  FORBIDDEN: "You do not have access to this action.",
  CONNECTION: "Cannot connect to the server.",
  INTERNAL: "Something went wrong. Please try again.",
};
export const errorMessage = (error: unknown, locale: "vi" | "en") =>
  error instanceof ApiError
    ? locale === "en"
      ? (english[error.code] ?? `${error.code}: ${error.message}`)
      : error.message
    : error instanceof Error
      ? error.message
      : String(error);
