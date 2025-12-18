import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Linking from 'expo-linking';
import { useColorScheme } from 'nativewind'; // <--- NEW: Import NativeWind Hook

import { useFinance } from '../context/FinanceContext';
import { storage } from '../services/storage';

// --- Reusable Settings Row ---
const SettingsRow = ({ icon, color, label, type = 'link', value, onValueChange, onPress, isLast = false }: any) => (
  <TouchableOpacity 
    onPress={type === 'link' ? onPress : undefined}
    activeOpacity={type === 'link' ? 0.7 : 1}
    className={`flex-row items-center justify-between p-4 bg-zinc-900 ${!isLast ? 'border-b border-zinc-800' : ''}`}
  >
    <View className="flex-row items-center gap-4">
      <View className={`w-8 h-8 rounded-lg items-center justify-center ${color}`}>
        <Ionicons name={icon} size={18} color="white" />
      </View>
      <Text className="text-white text-base font-medium">{label}</Text>
    </View>

    {type === 'switch' && (
      <Switch 
        value={value} 
        onValueChange={onValueChange} 
        trackColor={{ false: '#3f3f46', true: '#2563EB' }}
        thumbColor={Platform.OS === 'android' ? '#e4e4e7' : ''}
      />
    )}

    {type === 'link' && (
      <View className="flex-row items-center">
        {value && <Text className="text-zinc-500 mr-2">{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color="#52525b" />
      </View>
    )}
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest ml-4 mb-2 mt-8">
    {title}
  </Text>
);

export default function Settings() {
  const router = useRouter();
  
  // Get Context Functions
  const { securityEnabled, setSecurityEnabled, clearAllData, exportData } = useFinance();
  
  // Get Theme Functions
  const { colorScheme, toggleColorScheme } = useColorScheme(); // <--- Hook

  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    setBiometricSupported(hasHardware);
  };

  const handleSecurityToggle = async (val: boolean) => {
    if (val) {
      if (!biometricSupported) {
        Alert.alert("Not Supported", "Biometrics are not available on this device.");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm Biometrics",
      });
      if (result.success) {
        setSecurityEnabled(true);
        storage.set('security', true);
      }
    } else {
      setSecurityEnabled(false);
      storage.set('security', false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset App?",
      "This will permanently delete all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Everything", 
          style: "destructive", 
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
                Alert.alert("Reset Complete", "The app is fresh.");
                router.replace('/onboarding'); // Send back to start
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 border-b border-zinc-900 bg-black">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold">Settings</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        
        {/* PREFERENCES */}
        <SectionHeader title="Preferences" />
        <View className="rounded-xl overflow-hidden bg-zinc-900">
          <SettingsRow 
            icon={colorScheme === 'dark' ? "moon" : "sunny"}
            color="bg-indigo-500" 
            label="Dark Mode" 
            type="switch" 
            value={colorScheme === 'dark'} // True if dark
            onValueChange={toggleColorScheme} // NativeWind toggle
          />
          <SettingsRow 
            icon="lock-closed" 
            color="bg-emerald-500" 
            label="Biometric Lock" 
            type="switch" 
            isLast
            value={securityEnabled}
            onValueChange={handleSecurityToggle}
          />
        </View>

        {/* DATA */}
        <SectionHeader title="Data & Storage" />
        <View className="rounded-xl overflow-hidden bg-zinc-900">
          <SettingsRow 
            icon="cloud-upload" 
            color="bg-blue-500" 
            label="Export Data (CSV)" 
            onPress={exportData} // <--- Connected
          />
           <SettingsRow 
            icon="wallet" 
            color="bg-orange-500" 
            label="Manage Banks" 
            value="Default"
            onPress={() => Alert.alert("Coming Soon", "Bank management module")}
          />
          <SettingsRow 
            icon="trash" 
            color="bg-red-500" 
            label="Reset All Data" 
            isLast
            onPress={handleReset}
          />
        </View>

        {/* INFO */}
        <SectionHeader title="About" />
        <View className="rounded-xl overflow-hidden bg-zinc-900 mb-10">
          <SettingsRow 
            icon="help-buoy" 
            color="bg-zinc-600" 
            label="Help & Support" 
            onPress={() => Linking.openURL('https://google.com')}
          />
          <SettingsRow 
            icon="code-slash" 
            color="bg-zinc-600" 
            label="Version" 
            type="link"
            value="1.0.2"
            isLast
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </View>
  );
}