/**
 * In-memory OTP storage with expiration
 * OTPs expire after 3 minutes (configurable)
 */

interface StoredOTP {
  otp: string;
  createdAt: number;
  used: boolean;
}

class OTPStorage {
  private storage: Map<string, StoredOTP> = new Map();
  private expirationTime: number = 3 * 60 * 1000; // 3 minutes in milliseconds

  /**
   * Store an OTP
   * @param otp - The 6-digit OTP to store
   * @returns The key used to retrieve the OTP
   */
  store(otp: string): string {
    const key = this.generateKey();
    this.storage.set(key, {
      otp,
      createdAt: Date.now(),
      used: false,
    });
    return key;
  }

  /**
   * Verify an OTP
   * @param key - The key associated with the OTP
   * @param otp - The OTP to verify
   * @returns true if valid, false otherwise
   */
  verify(key: string, otp: string): boolean {
    const stored = this.storage.get(key);

    if (!stored) {
      return false; // OTP not found
    }

    if (stored.used) {
      return false; // OTP already used
    }

    const now = Date.now();
    const age = now - stored.createdAt;

    if (age > this.expirationTime) {
      // Expired - remove it
      this.storage.delete(key);
      return false;
    }

    if (stored.otp !== otp) {
      return false; // OTP mismatch
    }

    // Mark as used and remove
    this.storage.delete(key);
    return true;
  }

  /**
   * Check if an OTP exists and is valid (not expired, not used)
   * @param key - The key associated with the OTP
   * @returns true if exists and valid, false otherwise
   */
  isValid(key: string): boolean {
    const stored = this.storage.get(key);

    if (!stored) {
      return false;
    }

    if (stored.used) {
      return false;
    }

    const now = Date.now();
    const age = now - stored.createdAt;

    if (age > this.expirationTime) {
      this.storage.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove an OTP (cleanup)
   * @param key - The key to remove
   */
  remove(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Clean up expired OTPs (can be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, stored] of this.storage.entries()) {
      const age = now - stored.createdAt;
      if (age > this.expirationTime) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Generate a unique key for storing OTPs
   * @returns A unique key string
   */
  private generateKey(): string {
    return `otp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Singleton instance
export const otpStorage = new OTPStorage();

// Cleanup expired OTPs every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    otpStorage.cleanup();
  }, 5 * 60 * 1000);
}
