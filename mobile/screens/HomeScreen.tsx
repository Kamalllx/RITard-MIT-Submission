import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFinancial } from '../context/FinancialContext';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateMockTransactions, generateMockGoals, generateMockSpendingLimits, generateMockBlockedMerchants } from '../utils/mockData';

const HomeScreen: React.FC = () => {
  const { 
    transactions, 
    goals, 
    spendingLimits,
    totalIncome, 
    totalExpense, 
    netBalance,
    categoryTotals,
    addTransaction,
    addGoal,
    addSpendingLimit,
    addBlockedMerchant
  } = useFinancial();

  // Load mock data for demonstration if no data exists
  useEffect(() => {
    const loadMockData = async () => {
      if (transactions.length === 0) {
        const mockTransactions = generateMockTransactions(15);
        for (const transaction of mockTransactions) {
          const { id, ...transactionData } = transaction;
          await addTransaction(transactionData);
        }
      }

      if (goals.length === 0) {
        const mockGoals = generateMockGoals(3);
        for (const goal of mockGoals) {
          const { id, ...goalData } = goal;
          await addGoal(goalData);
        }
      }

      if (spendingLimits.length === 0) {
        const mockLimits = generateMockSpendingLimits();
        for (const limit of mockLimits) {
          const { id, ...limitData } = limit;
          await addSpendingLimit(limitData);
        }
      }

      // Add mock blocked merchants
      const mockMerchants = generateMockBlockedMerchants();
      for (const merchant of mockMerchants) {
        await addBlockedMerchant(merchant);
      }
    };

    loadMockData();
  }, []);

  // Get screen width for charts
  const screenWidth = Dimensions.get('window').width - 40;

  // Prepare data for spending by category pie chart
  const pieChartData = Object.entries(categoryTotals).map(([category, amount], index) => {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return {
      name: category,
      amount,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    };
  });

  // Prepare data for spending trend line chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const lineChartData = {
    labels: last7Days.map(date => date.substring(5)), // Show only MM-DD
    datasets: [
      {
        data: last7Days.map(date => {
          const dayTransactions = transactions.filter(t => 
            t.date === date && t.type === 'expense'
          );
          return dayTransactions.reduce((sum, t) => sum + t.amount, 0) || 0;
        }),
        color: () => '#2E7D32',
        strokeWidth: 2
      }
    ]
  };

  // Get recent transactions (last 5)
  const recentTransactions = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get top goals (first 3)
  const topGoals = goals.slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Dashboard</Text>
        <Text style={styles.subtitle}>Welcome to MindfulPay</Text>
      </View>
      
      {/* Balance Summary */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>Current Balance</Text>
        <Text style={styles.balanceAmount}>₹{netBalance.toLocaleString()}</Text>
        <View style={styles.balanceDetails}>
          <View style={styles.balanceItem}>
            <Ionicons name="arrow-up-circle" size={20} color="#4CAF50" />
            <Text style={styles.balanceItemText}>Income: ₹{totalIncome.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Ionicons name="arrow-down-circle" size={20} color="#F44336" />
            <Text style={styles.balanceItemText}>Expense: ₹{totalExpense.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Spending Trend Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Spending Trend (Last 7 Days)</Text>
        <LineChart
          data={lineChartData}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#2E7D32',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Spending by Category */}
      {pieChartData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={pieChartData}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.length > 0 ? (
          recentTransactions.map(transaction => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Ionicons name="cart-outline" size={24} color="#2E7D32" />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.description}</Text>
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
              </View>
              <View>
                <Text style={styles.transactionAmount}>-₹{transaction.amount.toLocaleString()}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent transactions</Text>
        )}
      </View>

      {/* Goals Progress */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Goals Progress</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {topGoals.length > 0 ? (
          topGoals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <View key={goal.id} style={styles.goalItem}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.name}</Text>
                  <Text style={styles.goalAmount}>
                    ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No goals set</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItemText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#2E7D32',
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  transactionCategory: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F44336',
    textAlign: 'right',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 2,
  },
  goalItem: {
    marginBottom: 15,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  goalAmount: {
    fontSize: 14,
    color: '#555',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginVertical: 15,
  },
});

export default HomeScreen;