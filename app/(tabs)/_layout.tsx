import "../global.css"
import { Stack } from 'expo-router';
import { FinanceProvider } from '../../context/FinanceContext';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function Layout() {
  return (
    <FinanceProvider>
      {/* 1. Force black background on the absolute root */}
      <View style={{ flex: 1, backgroundColor: '#000000' }}> 
        <StatusBar style="light" backgroundColor="#000000" />
        
        <Stack screenOptions={{ 
          headerShown: false,
          // 2. Ensure the content area is also black
          contentStyle: { backgroundColor: '#000000' }, 
          animation: 'slide_from_right'
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </View>
    </FinanceProvider>
  );
}