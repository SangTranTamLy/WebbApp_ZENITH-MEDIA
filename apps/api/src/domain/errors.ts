export class ShopError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: unknown = null,
  ) {
    super(message);
  }
}
export function requireCondition(
  condition: unknown,
  code: string,
  message: string,
  status = 400,
  details: unknown = null,
): asserts condition {
  if (!condition) throw new ShopError(status, code, message, details);
}
