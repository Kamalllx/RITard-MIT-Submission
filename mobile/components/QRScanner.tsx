import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { launchUpiPayment } from '../utils/upiLauncher';
import Toast from 'react-native-toast-message';
import { checkVendorBlocklist } from '../utils/vendorCheck';
import { checkSpendingLimit } from '../utils/spendingLimit';

interface QRScannerProps {
  onClose: () => void;
  onScanSuccess?: (upiId: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose, onScanSuccess }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const parseUpiQrData = (data: string) => {
    try {
      // UPI QR codes typically have format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
      const url = new URL(data);
      const params = new URLSearchParams(url.search);
      
      return {
        upiId: params.get('pa') || '',
        name: params.get('pn') || '',
        amount: params.get('am') ? parseFloat(params.get('am') || '0') : 0,
        note: params.get('tn') || 'Payment via QR code',
      };
    } catch (error) {
      console.error('Error parsing UPI QR data:', error);
      return null;
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    // Check if it's a UPI QR code
    if (!data.startsWith('upi://')) {
      Toast.show({
        type: 'error',
        text1: 'Invalid QR Code',
        text2: 'This is not a valid UPI QR code',
      });
      return;
    }
    
    const upiData = parseUpiQrData(data);
    
    if (!upiData) {
      Toast.show({
        type: 'error',
        text1: 'Invalid QR Code',
        text2: 'Could not parse UPI QR code data',
      });
      return;
    }
    
    // If onScanSuccess is provided and we just want to extract the UPI ID
    if (onScanSuccess) {
      Toast.show({
        type: 'success',
        text1: 'QR Code Scanned',
        text2: `UPI ID: ${upiData.upiId} detected`,
      });
      onScanSuccess(upiData.upiId);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check vendor blocklist
      if (checkVendorBlocklist(upiData.upiId)) {
        Toast.show({
          type: 'error',
          text1: 'Payment Blocked',
          text2: `Payments to ${upiData.upiId} are not allowed`,
        });
        setIsLoading(false);
        return;
      }

      // Check spending limit if amount is provided in QR
      if (upiData.amount > 0) {
        const isWithinLimit = await checkSpendingLimit(upiData.amount);
        if (!isWithinLimit) {
          Toast.show({
            type: 'error',
            text1: 'Spending Limit Exceeded',
            text2: 'You have exceeded your daily spending limit',
          });
          setIsLoading(false);
          return;
        }
      }

      // Confirm payment details
      Alert.alert(
        'Confirm Payment',
        `Pay ₹${upiData.amount || 'Not specified'} to ${upiData.name || upiData.upiId}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsLoading(false);
              setScanned(false);
            },
          },
          {
            text: 'Pay',
            onPress: async () => {
              // Launch UPI payment
              const success = await launchUpiPayment(
                upiData.upiId,
                upiData.amount || 0, // If amount is not in QR, user will enter in UPI app
                upiData.note
              );
              
              if (success) {
                Toast.show({
                  type: 'success',
                  text1: 'Payment Initiated',
                  text2: 'UPI payment app launched successfully',
                });
                onClose(); // Close scanner after successful payment
              }
              setIsLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: 'Could not process UPI payment',
      });
      console.error('QR payment error:', error);
      setIsLoading(false);
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      {scanned && !isLoading && (
        <TouchableOpacity 
          style={styles.scanAgainButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
      
      <View style={styles.overlay}>
        <View style={styles.scanWindow} />
        <Text style={styles.instructions}>Align QR code within the frame</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    width: 150,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanWindow: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: 'transparent',
  },
  instructions: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default QRScanner;