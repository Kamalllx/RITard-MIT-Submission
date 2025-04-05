import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '../context/FinancialContext';
import { GOAL_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';

const GoalsLimitsScreen: React.FC = () => {
  // Get data from financial context
  const { 
    goals, 
    spendingLimits, 
    addGoal, 
    updateGoal, 
    deleteGoal,
    addSpendingLimit,
    updateSpendingLimit,
    deleteSpendingLimit
  } = useFinancial();

  // State for active tab
  const [activeTab, setActiveTab] = useState<'goals' | 'limits'>('goals');

  // State for modals
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  // State for new goal form
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    category: GOAL_CATEGORIES[0],
    deadline: ''
  });

  // State for new spending limit form
  const [newLimit, setNewLimit] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly'
  });

  // Handle adding a new goal
  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addGoal({
        name: newGoal.name,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: Number(newGoal.currentAmount) || 0,
        category: newGoal.category,
        deadline: newGoal.deadline || undefined
      });

      // Reset form and close modal
      setNewGoal({
        name: '',
        targetAmount: '',
        currentAmount: '',
        category: GOAL_CATEGORIES[0],
        deadline: ''
      });
      setGoalModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  // Handle adding a new spending limit
  const handleAddLimit = async () => {
    if (!newLimit.amount) {
      Alert.alert('Error', 'Please enter a limit amount');
      return;
    }

    try {
      await addSpendingLimit({
        category: newLimit.category,
        amount: Number(newLimit.amount),
        period: newLimit.period
      });

      // Reset form and close modal
      setNewLimit({
        category: EXPENSE_CATEGORIES[0],
        amount: '',
        period: 'monthly'
      });
      setLimitModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add spending limit');
    }
  };

  // Handle deleting a goal
  const handleDeleteGoal = (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteGoal(id)
        }
      ]
    );
  };

  // Handle deleting a spending limit
  const handleDeleteLimit = (id: string) => {
    Alert.alert(
      'Delete Limit',
      'Are you sure you want to delete this spending limit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteSpendingLimit(id)
        }
      ]
    );
  };

  // Render goal item
  const renderGoalItem = (goal: any) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return (
      <View key={goal.id} style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{goal.name}</Text>
          <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)}>
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.itemCategory}>{goal.category}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              ₹{goal.currentAmount.toLocaleString()} of ₹{goal.targetAmount.toLocaleString()}
            </Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </View>
        
        {goal.deadline && (
          <Text style={styles.deadlineText}>Deadline: {goal.deadline}</Text>
        )}
        
        <TouchableOpacity 
          style={styles.contributeButton}
          onPress={() => {
            Alert.prompt(
              'Contribute to Goal',
              'Enter amount to add:',
              [{
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Add',
                onPress: (amount) => {
                  if (amount && !isNaN(Number(amount))) {
                    updateGoal(goal.id, Number(amount));
                  }
                }
              }],
              'plain-text',
              '',
              'numeric'
            );
          }}
        >
          <Text style={styles.contributeButtonText}>Contribute</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render spending limit item
  const renderLimitItem = (limit: any) => {
    return (
      <View key={limit.id} style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{limit.category}</Text>
          <TouchableOpacity onPress={() => handleDeleteLimit(limit.id)}>
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.limitDetails}>
          <View style={styles.limitAmount}>
            <Text style={styles.limitLabel}>Limit:</Text>
            <Text style={styles.limitValue}>₹{limit.amount.toLocaleString()}</Text>
          </View>
          
          <View style={styles.limitPeriod}>
            <Text style={styles.limitLabel}>Period:</Text>
            <Text style={styles.limitValue}>
              {limit.period.charAt(0).toUpperCase() + limit.period.slice(1)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            Alert.prompt(
              'Update Limit',
              'Enter new limit amount:',
              [{
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Update',
                onPress: (amount) => {
                  if (amount && !isNaN(Number(amount))) {
                    updateSpendingLimit(limit.id, Number(amount));
                  }
                }
              }],
              'plain-text',
              limit.amount.toString(),
              'numeric'
            );
          }}
        >
          <Text style={styles.editButtonText}>Edit Limit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render goal form modal
  const renderGoalModal = () => (
    <Modal
      visible={goalModalVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Goal</Text>
            <TouchableOpacity onPress={() => setGoalModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalForm}>
            <Text style={styles.inputLabel}>Goal Name *</Text>
            <TextInput
              style={styles.textInput}
              value={newGoal.name}
              onChangeText={(text) => setNewGoal({...newGoal, name: text})}
              placeholder="e.g., New Laptop"
            />
            
            <Text style={styles.inputLabel}>Target Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={newGoal.targetAmount}
              onChangeText={(text) => setNewGoal({...newGoal, targetAmount: text})}
              placeholder="e.g., 50000"
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Current Amount (₹)</Text>
            <TextInput
              style={styles.textInput}
              value={newGoal.currentAmount}
              onChangeText={(text) => setNewGoal({...newGoal, currentAmount: text})}
              placeholder="e.g., 10000"
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryContainer}>
              {GOAL_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    newGoal.category === category && styles.activeCategoryButton
                  ]}
                  onPress={() => setNewGoal({...newGoal, category})}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    newGoal.category === category && styles.activeCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.inputLabel}>Deadline (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={newGoal.deadline}
              onChangeText={(text) => setNewGoal({...newGoal, deadline: text})}
              placeholder="e.g., 2023-12-31"
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleAddGoal}
            >
              <Text style={styles.submitButtonText}>Add Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render spending limit form modal
  const renderLimitModal = () => (
    <Modal
      visible={limitModalVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Spending Limit</Text>
            <TouchableOpacity onPress={() => setLimitModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalForm}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryContainer}>
              {EXPENSE_CATEGORIES.slice(0, 8).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    newLimit.category === category && styles.activeCategoryButton
                  ]}
                  onPress={() => setNewLimit({...newLimit, category})}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    newLimit.category === category && styles.activeCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.inputLabel}>Limit Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={newLimit.amount}
              onChangeText={(text) => setNewLimit({...newLimit, amount: text})}
              placeholder="e.g., 5000"
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Period</Text>
            <View style={styles.periodContainer}>
              {['daily', 'weekly', 'monthly'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    newLimit.period === period && styles.activePeriodButton
                  ]}
                  onPress={() => setNewLimit({
                    ...newLimit, 
                    period: period as 'daily' | 'weekly' | 'monthly'
                  })}
                >
                  <Text style={[
                    styles.periodButtonText,
                    newLimit.period === period && styles.activePeriodText
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleAddLimit}
            >
              <Text style={styles.submitButtonText}>Add Limit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Goals & Limits</Text>
        
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
            onPress={() => setActiveTab('goals')}
          >
            <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>
              Goals
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'limits' && styles.activeTab]}
            onPress={() => setActiveTab('limits')}
          >
            <Text style={[styles.tabText, activeTab === 'limits' && styles.activeTabText]}>
              Spending Limits
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'goals' ? (
          <>
            {goals.length > 0 ? (
              goals.map(renderGoalItem)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="flag-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No Goals Yet</Text>
                <Text style={styles.emptySubtext}>
                  Set financial goals to track your progress
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {spendingLimits.length > 0 ? (
              spendingLimits.map(renderLimitItem)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No Spending Limits</Text>
                <Text style={styles.emptySubtext}>
                  Set spending limits to control your expenses
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          if (activeTab === 'goals') {
            setGoalModalVisible(true);
          } else {
            setLimitModalVisible(true);
          }
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Modals */}
      {renderGoalModal()}
      {renderLimitModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#2E7D32',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#555',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  deadlineText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  contributeButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  contributeButtonText: {
    color: '#2E7D32',
    fontWeight: '500',
    fontSize: 14,
  },
  limitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  limitAmount: {
    flex: 1,
  },
  limitPeriod: {
    flex: 1,
    alignItems: 'flex-end',
  },
  limitLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2E7D32',
    fontWeight: '500',
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#E8F5E9',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  periodContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  activePeriodButton: {
    backgroundColor: '#E8F5E9',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activePeriodText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GoalsLimitsScreen;