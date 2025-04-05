/**
 * Utility to check and track daily spending limits
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default daily spending limit (in rupees)
const DEFAULT_DAILY_LIMIT = 5000;

// Storage key for daily spending
const DAILY_SPENDING_KEY = 'mindfulpay_daily_spending';

// Interface for spending data
interface DailySpending {
  date: string;
  amount: number;
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
};

/**
 * Gets the current daily spending
 * @returns The current daily spending amount
 */
export const getCurrentDailySpending = async (): Promise<number> => {
  try {
    const todayString = getTodayDateString();
    const spendingData = await AsyncStorage.getItem(DAILY_SPENDING_KEY);
    
    if (spendingData) {
      const spending: DailySpending = JSON.parse(spendingData);
      
      // If the stored date is today, return the amount
      if (spending.date === todayString) {
        return spending.amount;
      }
    }
    
    // If no data or data is from a different day, return 0
    return 0;
  } catch (error) {
    console.error('Error getting daily spending:', error);
    return 0;
  }
};

/**
 * Updates the daily spending with a new transaction
 * @param amount The amount to add to daily spending
 */
export const updateDailySpending = async (amount: number): Promise<void> => {
  try {
    const todayString = getTodayDateString();
    const currentSpending = await getCurrentDailySpending();
    
    const newSpending: DailySpending = {
      date: todayString,
      amount: currentSpending + amount,
    };
    
    await AsyncStorage.setItem(DAILY_SPENDING_KEY, JSON.stringify(newSpending));
  } catch (error) {
    console.error('Error updating daily spending:', error);
  }
};

/**
 * Checks if a transaction amount exceeds the daily spending limit
 * @param amount The transaction amount to check
 * @returns true if the transaction is within limit, false otherwise
 */
export const checkSpendingLimit = async (amount: number): Promise<boolean> => {
  try {
    const currentSpending = await getCurrentDailySpending();
    const totalAfterTransaction = currentSpending + amount;
    
    // Check if the total spending after this transaction would exceed the limit
    return totalAfterTransaction <= DEFAULT_DAILY_LIMIT;
  } catch (error) {
    console.error('Error checking spending limit:', error);
    return false; // Fail safe - block transaction if there's an error
  }
};