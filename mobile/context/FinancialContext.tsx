import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for our financial data
export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  merchant?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: string;
}

export interface SpendingLimit {
  id: string;
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  resetDate?: string;
}

// Context interface
interface FinancialContextType {
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Spending Limits
  spendingLimits: SpendingLimit[];
  addSpendingLimit: (limit: Omit<SpendingLimit, 'id'>) => Promise<void>;
  updateSpendingLimit: (id: string, amount: number) => Promise<void>;
  deleteSpendingLimit: (id: string) => Promise<void>;
  
  // Blocked Merchants
  blockedMerchants: string[];
  addBlockedMerchant: (merchant: string) => Promise<void>;
  removeBlockedMerchant: (merchant: string) => Promise<void>;
  isBlockedMerchant: (merchant: string) => boolean;
  
  // Summary data
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryTotals: Record<string, number>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

// Storage keys
const TRANSACTIONS_KEY = 'mindfulpay_transactions';
const GOALS_KEY = 'mindfulpay_goals';
const SPENDING_LIMITS_KEY = 'mindfulpay_spending_limits';
const BLOCKED_MERCHANTS_KEY = 'mindfulpay_blocked_merchants';

// Create the context with a default value
const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Provider component
export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for all financial data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([]);
  const [blockedMerchants, setBlockedMerchants] = useState<string[]>([]);
  
  // Derived state for summary data
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});

  // Load data from AsyncStorage on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Calculate summary data whenever transactions change
  useEffect(() => {
    calculateSummaryData();
  }, [transactions]);

  // Load all data from AsyncStorage
  const loadAllData = async () => {
    try {
      // Load transactions
      const transactionsData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      if (transactionsData) {
        setTransactions(JSON.parse(transactionsData));
      }

      // Load goals
      const goalsData = await AsyncStorage.getItem(GOALS_KEY);
      if (goalsData) {
        setGoals(JSON.parse(goalsData));
      }

      // Load spending limits
      const limitsData = await AsyncStorage.getItem(SPENDING_LIMITS_KEY);
      if (limitsData) {
        setSpendingLimits(JSON.parse(limitsData));
      }

      // Load blocked merchants
      const merchantsData = await AsyncStorage.getItem(BLOCKED_MERCHANTS_KEY);
      if (merchantsData) {
        setBlockedMerchants(JSON.parse(merchantsData));
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  // Calculate summary data from transactions
  const calculateSummaryData = () => {
    let income = 0;
    let expense = 0;
    const categoryMap: Record<string, number> = {};

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
        
        // Add to category totals
        if (categoryMap[transaction.category]) {
          categoryMap[transaction.category] += transaction.amount;
        } else {
          categoryMap[transaction.category] = transaction.amount;
        }
      }
    });

    setTotalIncome(income);
    setTotalExpense(expense);
    setNetBalance(income - expense);
    setCategoryTotals(categoryMap);
  };

  // Transaction functions
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
      };

      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Goal functions
  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      const newGoal: Goal = {
        ...goal,
        id: Date.now().toString(),
      };

      const updatedGoals = [...goals, newGoal];
      setGoals(updatedGoals);
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoal = async (id: string, amount: number) => {
    try {
      const updatedGoals = goals.map(goal => {
        if (goal.id === id) {
          return { ...goal, currentAmount: goal.currentAmount + amount };
        }
        return goal;
      });

      setGoals(updatedGoals);
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const updatedGoals = goals.filter(g => g.id !== id);
      setGoals(updatedGoals);
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Spending limit functions
  const addSpendingLimit = async (limit: Omit<SpendingLimit, 'id'>) => {
    try {
      const newLimit: SpendingLimit = {
        ...limit,
        id: Date.now().toString(),
      };

      const updatedLimits = [...spendingLimits, newLimit];
      setSpendingLimits(updatedLimits);
      await AsyncStorage.setItem(SPENDING_LIMITS_KEY, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error adding spending limit:', error);
    }
  };

  const updateSpendingLimit = async (id: string, amount: number) => {
    try {
      const updatedLimits = spendingLimits.map(limit => {
        if (limit.id === id) {
          return { ...limit, amount };
        }
        return limit;
      });

      setSpendingLimits(updatedLimits);
      await AsyncStorage.setItem(SPENDING_LIMITS_KEY, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error updating spending limit:', error);
    }
  };

  const deleteSpendingLimit = async (id: string) => {
    try {
      const updatedLimits = spendingLimits.filter(l => l.id !== id);
      setSpendingLimits(updatedLimits);
      await AsyncStorage.setItem(SPENDING_LIMITS_KEY, JSON.stringify(updatedLimits));
    } catch (error) {
      console.error('Error deleting spending limit:', error);
    }
  };

  // Blocked merchant functions
  const addBlockedMerchant = async (merchant: string) => {
    try {
      if (!blockedMerchants.includes(merchant)) {
        const updatedMerchants = [...blockedMerchants, merchant];
        setBlockedMerchants(updatedMerchants);
        await AsyncStorage.setItem(BLOCKED_MERCHANTS_KEY, JSON.stringify(updatedMerchants));
      }
    } catch (error) {
      console.error('Error adding blocked merchant:', error);
    }
  };

  const removeBlockedMerchant = async (merchant: string) => {
    try {
      const updatedMerchants = blockedMerchants.filter(m => m !== merchant);
      setBlockedMerchants(updatedMerchants);
      await AsyncStorage.setItem(BLOCKED_MERCHANTS_KEY, JSON.stringify(updatedMerchants));
    } catch (error) {
      console.error('Error removing blocked merchant:', error);
    }
  };

  const isBlockedMerchant = (merchant: string): boolean => {
    return blockedMerchants.includes(merchant.toLowerCase().trim());
  };

  // Utility functions
  const refreshData = async () => {
    await loadAllData();
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        TRANSACTIONS_KEY,
        GOALS_KEY,
        SPENDING_LIMITS_KEY,
        BLOCKED_MERCHANTS_KEY
      ]);
      setTransactions([]);
      setGoals([]);
      setSpendingLimits([]);
      setBlockedMerchants([]);
      setTotalIncome(0);
      setTotalExpense(0);
      setNetBalance(0);
      setCategoryTotals({});
    } catch (error) {
      console.error('Error clearing financial data:', error);
    }
  };

  // Context value
  const value: FinancialContextType = {
    transactions,
    addTransaction,
    deleteTransaction,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    spendingLimits,
    addSpendingLimit,
    updateSpendingLimit,
    deleteSpendingLimit,
    blockedMerchants,
    addBlockedMerchant,
    removeBlockedMerchant,
    isBlockedMerchant,
    totalIncome,
    totalExpense,
    netBalance,
    categoryTotals,
    refreshData,
    clearAllData,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

// Custom hook to use the financial context
export const useFinancial = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};