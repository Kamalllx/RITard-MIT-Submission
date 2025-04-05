/**
 * Predefined categories for transactions and financial goals
 */

// Transaction categories
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Bills & Utilities',
  'Health & Medical',
  'Education',
  'Travel',
  'Personal Care',
  'Gifts & Donations',
  'Housing',
  'Investments',
  'Other'
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Gifts',
  'Refunds',
  'Other'
];

// Goal categories
export const GOAL_CATEGORIES = [
  'Savings',
  'Emergency Fund',
  'Vacation',
  'Education',
  'Electronics',
  'Vehicle',
  'Home',
  'Debt Repayment',
  'Retirement',
  'Other'
];

// Default category icons (can be used with Ionicons)
export const CATEGORY_ICONS: Record<string, string> = {
  // Expense categories
  'Food & Dining': 'restaurant',
  'Shopping': 'cart',
  'Transportation': 'car',
  'Entertainment': 'film',
  'Bills & Utilities': 'receipt',
  'Health & Medical': 'medical',
  'Education': 'school',
  'Travel': 'airplane',
  'Personal Care': 'person',
  'Gifts & Donations': 'gift',
  'Housing': 'home',
  'Investments': 'trending-up',
  
  // Income categories
  'Salary': 'cash',
  'Freelance': 'briefcase',
  'Business': 'business',
  'Gifts': 'gift',
  'Refunds': 'return-down-back',
  
  // Goal categories
  'Savings': 'save',
  'Emergency Fund': 'medkit',
  'Vacation': 'airplane',
  'Electronics': 'laptop',
  'Vehicle': 'car',
  'Home': 'home',
  'Debt Repayment': 'trending-down',
  'Retirement': 'umbrella',
  
  // Default
  'Other': 'ellipsis-horizontal'
};

// Get all categories combined
export const getAllCategories = () => {
  return [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...GOAL_CATEGORIES])];
};

// Get icon for a category
export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category] || 'ellipsis-horizontal';
};