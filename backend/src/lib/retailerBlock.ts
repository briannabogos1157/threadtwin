/** A retailer refused the page. These failures are not sent to Manus. */
export function isRetailerBlock(message: string): boolean {
  return /HTTP 4\d\d|product page blocked the request|access denied|unusual activity|verify you are human|robot check|captcha/i.test(
    message
  );
}
