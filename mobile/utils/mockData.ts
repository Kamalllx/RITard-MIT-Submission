/**
 * Utility to generate mock financial data for development and testing
 */
import { Transaction, Goal, SpendingLimit } from '../context/FinancialContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, GOAL_CATEGORIES } from './categories';

// Helper to get random item from array
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper to get random amount within range
const getRandomAmount = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Helper to get random date within last n days
const getRandomDate = (daysBack: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Generate mock transactions
export const generateMockTransactions = (count: number = 20): Transaction[] => {
  const transactions: Transaction[] = [];
  
  for (let i = 0; i < count; i++) {
    const isExpense = Math.random() > 0.3; // 70% chance of being an expense
    const type = isExpense ? 'expense' : 'income';
    const category = isExpense 
      ? getRandomItem(EXPENSE_CATEGORIES)
      : getRandomItem(INCOME_CATEGORIES);
    
    const amount = isExpense
      ? getRandomAmount(100, 5000) // Expenses between ₹100 and ₹5000
      : getRandomAmount(5000, 50000); // Income between ₹5000 and ₹50000
    
    transactions.push({
      id: `mock-${Date.now()}-${i}`,
      amount,
      type: type as 'income' | 'expense',
      category,
      description: `Mock ${type} for ${category}`,
      date: getRandomDate(30), // Within last 30 days
      merchant: isExpense ? `Merchant-${i}` : undefined,
    });
  }
  
  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate mock goals
export const generateMockGoals = (count: number = 5): Goal[] => {
  const goals: Goal[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = getRandomItem(GOAL_CATEGORIES);
    const targetAmount = getRandomAmount(10000, 100000);
    const progress = Math.random(); // Random progress between 0 and 1
    
    goals.push({
      id: `goal-${Date.now()}-${i}`,
      name: `${category} Goal`,
      targetAmount,
      currentAmount: Math.floor(targetAmount * progress),
      category,
      deadline: getRandomDate(-180), // Random date in the future (up to 180 days)
    });
  }
  
  return goals;
};

// Generate mock spending limits
export const generateMockSpendingLimits = (): SpendingLimit[] => {
  const limits: SpendingLimit[] = [];
  const periods: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
  
  // Create limits for some random categories
  const categoriesToLimit = EXPENSE_CATEGORIES.slice(0, 5); // First 5 categories
  
  categoriesToLimit.forEach((category, index) => {
    limits.push({
      id: `limit-${Date.now()}-${index}`,
      category,
      amount: getRandomAmount(1000, 10000),
      period: getRandomItem(periods),
    });
  });
  
  return limits;
};

// Generate mock blocked merchants
export const generateMockBlockedMerchants = (): string[] => {
  return [
    'fastfood@upi',
    'gaming@upi',
    'lottery@upi',
    'casino@upi',
    'tobacco@upi'
  ];
};