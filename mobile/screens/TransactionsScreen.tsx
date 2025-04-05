import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '../context/FinancialContext';
import { Transaction } from '../context/FinancialContext';

const TransactionsScreen: React.FC = () => {
  const { transactions } = useFinancial();
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Filtered and sorted transactions
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  // Group transactions by date for section list
  const [groupedTransactions, setGroupedTransactions] = useState<any[]>([]);
  
  // Process transactions whenever filter, search, or sort changes
  useEffect(() => {
    // Apply filters
    let result = [...transactions];
    
    // Filter by type
    if (filter !== 'all') {
      result = result.filter(t => t.type === filter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.merchant && t.merchant.toLowerCase().includes(query))
      );
    }
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredTransactions(result);
    
    // Group by date for section list
    const grouped = groupTransactionsByDate(result);
    setGroupedTransactions(grouped);
  }, [transactions, filter, searchQuery, sortOrder]);
  
  // Group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    
    transactions.forEach(transaction => {
      if (!groups[transaction.date]) {
        groups[transaction.date] = [];
      }
      groups[transaction.date].push(transaction);
    });
    
    // Convert to array format for SectionList
    return Object.entries(groups).map(([date, data]) => ({
      title: formatDate(date),
      data
    }));
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    return (
      <TouchableOpacity style={styles.transactionItem}>
        <View style={[styles.iconContainer, item.type === 'income' ? styles.incomeIcon : styles.expenseIcon]}>
          <Ionicons 
            name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color="white" 
          />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{item.description}</Text>
          <Text style={styles.transactionCategory}>{item.category}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, item.type === 'income' ? styles.incomeText : styles.expenseText]}>
            {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}
          </Text>
          {item.merchant && (
            <Text style={styles.merchantText}>{item.merchant}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render section header
  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* Header with search */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Filter and sort options */}
        <View style={styles.filterContainer}>
          <View style={styles.filterButtons}>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterButtonText, filter === 'all' && styles.activeFilterText]}>All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'income' && styles.activeFilterButton]}
              onPress={() => setFilter('income')}
            >
              <Text style={[styles.filterButtonText, filter === 'income' && styles.activeFilterText]}>Income</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'expense' && styles.activeFilterButton]}
              onPress={() => setFilter('expense')}
            >
              <Text style={[styles.filterButtonText, filter === 'expense' && styles.activeFilterText]}>Expenses</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort:</Text>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              <Text style={styles.sortButtonText}>
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </Text>
              <Ionicons 
                name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'} 
                size={14} 
                color="#2E7D32" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Transaction list */}
      {filteredTransactions.length > 0 ? (
        <SectionList
          sections={groupedTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No Transactions Found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || filter !== 'all' 
              ? 'Try changing your filters or search terms'
              : 'Add your first transaction to get started'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#E8F5E9',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#2E7D32',
    marginRight: 4,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: '#4CAF50',
  },
  expenseIcon: {
    backgroundColor: '#F44336',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },
  merchantText: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
});

export default TransactionsScreen;