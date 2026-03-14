/**
 * OTP Generation Utility
 * Generates a random 6-digit numeric OTP
 */

/**
 * Generate a random 6-digit numeric OTP
 * @returns A 6-digit string (e.g., "582194")
 */
export function generateOTP(): string {
  // Generate a random number between 100000 and 999999
  const min = 100000;
  const max = 999999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  return otp.toString();
}

/**
 * Validate OTP format (must be exactly 6 digits)
 * @param otp - The OTP to validate
 * @returns true if valid format, false otherwise
 */
export function isValidOTPFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}
