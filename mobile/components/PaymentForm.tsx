import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { checkVendorBlocklist } from '../utils/vendorCheck';
import { checkSpendingLimit } from '../utils/spendingLimit';
import { launchUpiPayment } from '../utils/upiLauncher';
import Toast from 'react-native-toast-message';

interface PaymentFormProps {
  upiId?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ upiId: scannedUpiId }) => {
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update UPI ID when scanned value is received
  useEffect(() => {
    if (scannedUpiId) {
      setUpiId(scannedUpiId);
    }
  }, [scannedUpiId]);

  const handlePayment = async () => {
    // Validate inputs
    if (!upiId || !amount || !note) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill all the fields',
      });
      return;
    }

    // Validate UPI ID format
    if (!upiId.includes('@')) {
      Toast.show({
        type: 'error',
        text1: 'Invalid UPI ID',
        text2: 'UPI ID should be in format username@upi',
      });
      return;
    }

    // Parse amount to number
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid amount',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check vendor blocklist
      if (checkVendorBlocklist(upiId)) {
        Toast.show({
          type: 'error',
          text1: 'Payment Blocked',
          text2: `Payments to ${upiId} are not allowed`,
        });
        setIsLoading(false);
        return;
      }

      // Check spending limit
      const isWithinLimit = await checkSpendingLimit(amountValue);
      if (!isWithinLimit) {
        Toast.show({
          type: 'error',
          text1: 'Spending Limit Exceeded',
          text2: 'You have exceeded your daily spending limit',
        });
        setIsLoading(false);
        return;
      }

      // Launch UPI payment
      const success = await launchUpiPayment(upiId, amountValue, note);
      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Payment Initiated',
          text2: 'UPI payment app launched successfully',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: 'Could not launch UPI payment',
      });
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MindfulPay</Text>
      <Text style={styles.subtitle}>Control your UPI payments</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>UPI ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter UPI ID (e.g. username@upi)"
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter payment note"
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Make Payment'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentForm;