import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '../context/FinancialContext';

const ProfileScreen: React.FC = () => {
  const { 
    blockedMerchants, 
    addBlockedMerchant, 
    removeBlockedMerchant,
    clearAllData
  } = useFinancial();

  // State for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // State for modals
  const [blockedMerchantsModalVisible, setBlockedMerchantsModalVisible] = useState(false);
  const [newMerchant, setNewMerchant] = useState('');

  // Handle adding a new blocked merchant
  const handleAddBlockedMerchant = () => {
    if (newMerchant.trim()) {
      addBlockedMerchant(newMerchant.trim());
      setNewMerchant('');
    }
  };

  // Handle removing a blocked merchant
  const handleRemoveBlockedMerchant = (merchant: string) => {
    removeBlockedMerchant(merchant);
  };

  // Handle clearing all data
  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all your financial data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Success', 'All data has been cleared');
          }
        }
      ]
    );
  };

  // Render blocked merchants modal
  const renderBlockedMerchantsModal = () => (
    <Modal
      visible={blockedMerchantsModalVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Blocked Merchants</Text>
            <TouchableOpacity onPress={() => setBlockedMerchantsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.addMerchantContainer}>
            <TextInput
              style={styles.merchantInput}
              value={newMerchant}
              onChangeText={setNewMerchant}
              placeholder="Enter merchant UPI ID"
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddBlockedMerchant}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.merchantsList}>
            {blockedMerchants.length > 0 ? (
              blockedMerchants.map((merchant, index) => (
                <View key={index} style={styles.merchantItem}>
                  <Text style={styles.merchantText}>{merchant}</Text>
                  <TouchableOpacity onPress={() => handleRemoveBlockedMerchant(merchant)}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No blocked merchants</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>MP</Text>
        </View>
        <Text style={styles.userName}>MindfulPay User</Text>
        <Text style={styles.userEmail}>user@example.com</Text>
      </View>
      
      {/* Settings Sections */}
      <View style={styles.settingsContainer}>
        {/* Account Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="person-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* App Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="notifications-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={notificationsEnabled ? '#2E7D32' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="moon-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={darkModeEnabled ? '#2E7D32' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="finger-print-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Biometric Authentication</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={biometricEnabled ? '#2E7D32' : '#f4f3f4'}
            />
          </View>
        </View>
        
        {/* Financial Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Financial Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => setBlockedMerchantsModalVisible(true)}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="ban-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Blocked Merchants</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{blockedMerchants.length}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="wallet-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Default Payment Method</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* Data Management */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="download-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Export Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={handleClearAllData}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="trash-outline" size={22} color="#F44336" style={styles.settingsIcon} />
              <Text style={[styles.settingsItemText, { color: '#F44336' }]}>Clear All Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* About */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>About MindfulPay</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="document-text-outline" size={22} color="#2E7D32" style={styles.settingsIcon} />
              <Text style={styles.settingsItemText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>MindfulPay v1.0.0</Text>
        </View>
      </View>
      
      {/* Modals */}
      {renderBlockedMerchantsModal()}
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#2E7D32',
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  settingsContainer: {
    padding: 15,
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginRight: 12,
  },
  settingsItemText: {
    fontSize: 16,
    color: '#333',
  },
  badgeContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  versionText: {
    fontSize: 14,
    color: '#888',
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
  addMerchantContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  merchantInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  merchantsList: {
    padding: 15,
  },
  merchantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  merchantText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ProfileScreen;