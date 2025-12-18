import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { KENYAN_BANKS, formatCurrency } from '../utils/currency';

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useFinance();
  const [step, setStep] = useState(1);

  // --- FORM DATA ---
  const [username, setUsername] = useState('');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [salary, setSalary] = useState('');
  const [payWeek, setPayWeek] = useState('4'); // 1, 2, 3, or 4
  const [bills, setBills] = useState<{name: string, amount: string}[]>([{ name: '', amount: '' }]);

  // --- LOGIC ---
  const toggleBank = (bank: string) => {
    if (selectedBanks.includes(bank)) setSelectedBanks(selectedBanks.filter(b => b !== bank));
    else setSelectedBanks([...selectedBanks, bank]);
  };

  const addBillRow = () => setBills([...bills, { name: '', amount: '' }]);
  
  const updateBill = (index: number, field: 'name' | 'amount', value: string) => {
    const newBills = [...bills];
    newBills[index][field] = value;
    setBills(newBills);
  };

  const handleNext = () => {
    if (step === 1 && !username) return Alert.alert("Required", "Please tell us your name.");
    if (step === 2 && selectedBanks.length === 0) return Alert.alert("Required", "Select at least one bank or Cash.");
    if (step === 3 && !salary) return Alert.alert("Required", "Please enter your income.");
    
    if (step < 5) setStep(step + 1);
    else finishSetup();
  };

const finishSetup = async () => {
    // FIX: Convert bills to numbers before sending to Context
    const cleanBills = bills
      .filter(b => b.name && b.amount)
      .map(b => ({ 
        name: b.name, 
        amount: parseFloat(b.amount) || 0 
      }));

    await completeOnboarding(
      username, 
      selectedBanks, 
      parseFloat(salary) || 0, 
      payWeek, 
      cleanBills
    );
    router.replace('/');
  };

  // --- CALCULATIONS ---
  const totalIncome = parseFloat(salary) || 0;
  const totalBills = bills.reduce((sum, bill) => {
    const val = parseFloat(bill.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const remaining = totalIncome - totalBills;
  const burnRate = totalIncome > 0 ? (totalBills / totalIncome) * 100 : 0;

  // --- RENDER STEPS ---
  
  const renderStep1_User = () => (
    <View>
      <Text className="text-white text-3xl font-bold mb-2">Welcome</Text>
      <Text className="text-zinc-400 mb-8">What should we call you?</Text>
      <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <TextInput 
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. Kamau"
          placeholderTextColor="#52525b"
          className="text-white text-2xl font-bold"
          autoFocus
        />
      </View>
    </View>
  );

  const renderStep2_Banks = () => (
    <View>
      <Text className="text-white text-3xl font-bold mb-2">My Wallet</Text>
      <Text className="text-zinc-400 mb-8">Where do you keep your money?</Text>
      <View className="flex-row flex-wrap gap-3">
        {KENYAN_BANKS.map(bank => {
          const isSelected = selectedBanks.includes(bank);
          return (
            <TouchableOpacity 
              key={bank}
              onPress={() => toggleBank(bank)}
              className={`px-5 py-3 rounded-xl border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-zinc-900 border-zinc-800'}`}
            >
              <Text className={`font-semibold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{bank}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep3_Income = () => (
    <View>
      <Text className="text-white text-3xl font-bold mb-2">Income</Text>
      <Text className="text-zinc-400 mb-8">What is your monthly net income?</Text>
      
      <View className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mb-6">
        <Text className="text-zinc-500 text-xs font-bold tracking-widest mb-2">AMOUNT (KES)</Text>
        <TextInput 
          value={salary}
          onChangeText={setSalary}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#52525b"
          className="text-white text-4xl font-bold"
        />
      </View>

      <Text className="text-zinc-400 mb-4">When do you usually get paid?</Text>
      <View className="flex-row gap-2">
        {['1st', '2nd', '3rd', '4th'].map((wk) => (
          <TouchableOpacity 
            key={wk}
            onPress={() => setPayWeek(wk[0])} // Store '1', '2', etc
            className={`flex-1 py-4 items-center rounded-xl border ${payWeek === wk[0] ? 'bg-blue-600 border-blue-600' : 'bg-zinc-900 border-zinc-800'}`}
          >
            <Text className={`font-bold ${payWeek === wk[0] ? 'text-white' : 'text-zinc-500'}`}>{wk} Wk</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4_Bills = () => (
    <View>
      <Text className="text-white text-3xl font-bold mb-2">Fixed Costs</Text>
      <Text className="text-zinc-400 mb-6">Recurring bills (Rent, WiFi, Showmax, etc).</Text>
      
      {bills.map((bill, index) => (
        <View key={index} className="flex-row gap-3 mb-3">
           <TextInput 
             placeholder="Name"
             placeholderTextColor="#52525b"
             value={bill.name}
             onChangeText={(t) => updateBill(index, 'name', t)}
             className="flex-1 bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800"
           />
           <TextInput 
             placeholder="KES"
             placeholderTextColor="#52525b"
             keyboardType="numeric"
             value={bill.amount}
             onChangeText={(t) => updateBill(index, 'amount', t)}
             className="w-1/3 bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 font-bold text-right"
           />
        </View>
      ))}

      <TouchableOpacity onPress={addBillRow} className="flex-row items-center justify-center py-4 bg-zinc-900/50 rounded-xl mt-2 border border-zinc-800 border-dashed">
        <Ionicons name="add" size={20} color="#3b82f6" />
        <Text className="text-blue-500 font-bold ml-2">Add Bill</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep5_Analysis = () => (
    <View>
      <Text className="text-white text-3xl font-bold mb-2">The Breakdown</Text>
      <Text className="text-zinc-400 mb-8">Here is your effective spending power.</Text>
      
      {/* The Calculation Card */}
      <View className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 mb-6">
        <View className="flex-row justify-between mb-2">
            <Text className="text-zinc-400">Total Income</Text>
            <Text className="text-emerald-400 font-bold">{formatCurrency(totalIncome)}</Text>
        </View>
        <View className="flex-row justify-between mb-6">
            <Text className="text-zinc-400">Fixed Bills</Text>
            <Text className="text-red-400 font-bold">- {formatCurrency(totalBills)}</Text>
        </View>
        
        <View className="h-[1px] bg-zinc-800 w-full mb-6" />

        <Text className="text-zinc-500 text-xs font-bold tracking-widest uppercase text-center mb-2">Safe To Spend</Text>
        <Text className={`text-5xl font-bold text-center ${remaining < 0 ? 'text-red-500' : 'text-white'}`}>
            {formatCurrency(remaining)}
        </Text>
      </View>

      {/* Burn Rate Indicator */}
      <View className="flex-row items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
         <View className={`w-12 h-12 rounded-full items-center justify-center ${burnRate > 50 ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
            <Ionicons name={burnRate > 50 ? "alert" : "checkmark"} size={24} color={burnRate > 50 ? "#ef4444" : "#10b981"} />
         </View>
         <View className="flex-1">
            <Text className="text-white font-bold">
                {burnRate > 50 ? "High Fixed Costs" : "Healthy Balance"}
            </Text>
            <Text className="text-zinc-500 text-xs">
                Bills take up {Math.round(burnRate)}% of your income.
            </Text>
         </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#111827', '#000000']} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-16">
          
          {/* Progress Dots */}
          <View className="flex-row justify-center gap-2 mb-10">
             {[1,2,3,4,5].map(i => (
                 <View key={i} className={`h-2 rounded-full ${step >= i ? 'bg-blue-600 w-6' : 'bg-zinc-800 w-2'}`} />
             ))}
          </View>

          {step === 1 && renderStep1_User()}
          {step === 2 && renderStep2_Banks()}
          {step === 3 && renderStep3_Income()}
          {step === 4 && renderStep4_Bills()}
          {step === 5 && renderStep5_Analysis()}

          <View className="h-20" /> 
        </ScrollView>

        {/* Footer Nav */}
        <View className="p-6 pb-8 bg-black/90">
           <TouchableOpacity 
             onPress={handleNext}
             className="bg-white py-4 rounded-full items-center shadow-lg active:bg-gray-200"
           >
             <Text className="text-black font-bold text-lg">
               {step === 5 ? 'Open My Vault' : 'Continue'}
             </Text>
           </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}