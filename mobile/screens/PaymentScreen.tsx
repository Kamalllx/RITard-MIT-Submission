import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import PaymentForm from '../components/PaymentForm';
import QRScanner from '../components/QRScanner';
import { Ionicons } from '@expo/vector-icons';

const PaymentScreen: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState('');

  if (showScanner) {
    return <QRScanner 
      onClose={() => setShowScanner(false)} 
      onScanSuccess={(upiId) => {
        setScannedUpiId(upiId);
        setShowScanner(false);
      }} 
    />;
  }

  return (
    <View style={styles.container}>
      <PaymentForm upiId={scannedUpiId} />
      <TouchableOpacity 
        style={styles.scanButton} 
        onPress={() => setShowScanner(true)}
      >
        <Ionicons name="qr-code-outline" size={24} color="white" />
        <Text style={styles.scanButtonText}>Scan QR Code</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scanButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 50,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PaymentScreen;