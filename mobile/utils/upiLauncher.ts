/**
 * Utility to launch UPI payment apps
 */
import { Linking } from 'react-native';
import { updateDailySpending } from './spendingLimit';

/**
 * Launches a UPI payment app with the specified parameters
 * @param upiId The UPI ID of the recipient
 * @param amount The amount to pay
 * @param note The payment note
 * @returns Promise that resolves to true if the UPI app was launched successfully
 */
export const launchUpiPayment = async (
  upiId: string,
  amount: number,
  note: string
): Promise<boolean> => {
  try {
    // Format the UPI payment URL
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    
    // Check if the device can open the UPI URL
    const canOpen = await Linking.canOpenURL(upiUrl);
    
    if (!canOpen) {
      console.error('No UPI app available to handle this payment');
      return false;
    }
    
    // Open the UPI URL
    await Linking.openURL(upiUrl);
    
    // Update daily spending after successful launch
    await updateDailySpending(amount);
    
    return true;
  } catch (error) {
    console.error('Error launching UPI payment:', error);
    return false;
  }
};