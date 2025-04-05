import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import Toast from 'react-native-toast-message';
import AppNavigator from './navigation/AppNavigator';
import { FinancialProvider } from './context/FinancialContext';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <FinancialProvider>
        <AppNavigator />
        <StatusBar style="auto" />
        <Toast />
      </FinancialProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
});
