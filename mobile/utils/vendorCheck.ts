/**
 * Utility to check if a UPI ID is in the blocklist
 */

// Hardcoded list of blocked vendors
const BLOCKED_VENDORS = [
  'zomato@upi',
  'swiggy@upi',
  'dunzo@upi',
  'blinkit@upi',
  'zepto@upi',
];

/**
 * Checks if a UPI ID is in the blocklist
 * @param upiId The UPI ID to check
 * @returns true if the UPI ID is blocked, false otherwise
 */
export const checkVendorBlocklist = (upiId: string): boolean => {
  // Convert to lowercase for case-insensitive comparison
  const normalizedUpiId = upiId.toLowerCase().trim();
  
  // Check if the UPI ID is in the blocklist
  return BLOCKED_VENDORS.some(vendor => normalizedUpiId === vendor.toLowerCase());
};