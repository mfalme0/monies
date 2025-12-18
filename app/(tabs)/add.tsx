import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { KENYAN_BANKS, CATEGORIES, formatCurrency } from '../../utils/currency';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function AddScreen() {
  const router = useRouter();
  const { addIncome, addExpense, addLoan, repayLoan, loans } = useFinance();
  const params = useLocalSearchParams();
  
  const [tab, setTab] = useState<'IN' | 'OUT' | 'LOAN'>(
    (params.tab as 'IN' | 'OUT' | 'LOAN') || 'IN'
  );
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  const [selectedBank, setSelectedBank] = useState(KENYAN_BANKS[0]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.FOOD.id);
  const [loanMode, setLoanMode] = useState<'NEW' | 'PAY'>('NEW');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert("Invalid Amount", "Please enter a valid number");
      return;
    }

    const val = parseFloat(amount);

    try {
      if (tab === 'IN') {
        await addIncome(selectedBank, val, note || 'Deposit');
      } else if (tab === 'OUT') {
        await addExpense(selectedCategory, val, note || 'Expense');
      } else if (tab === 'LOAN') {
        if (loanMode === 'NEW') {
          await addLoan(note || 'Personal Loan', val);
        } else {
          if (!selectedLoanId) return Alert.alert("Error", "Select a loan to repay");
          await repayLoan(selectedLoanId, val);
        }
      }
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not save transaction.");
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View className="px-6 pt-16 pb-6 flex-row justify-between items-center">
            <Text className="text-white text-[34px] font-bold tracking-tight">New Entry</Text>
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-11 h-11 rounded-full bg-white/10 border border-white/20 items-center justify-center active:opacity-70"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <View className="px-6 mb-8">
            <View 
              className="rounded-2xl overflow-hidden p-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <BlurView intensity={20} tint="dark" style={{ flexDirection: 'row', borderRadius: 12 }}>
                {['IN', 'OUT', 'LOAN'].map((t) => (
                  <TouchableOpacity 
                    key={t} 
                    onPress={() => setTab(t as any)}
                    className={`flex-1 py-3.5 items-center rounded-xl ${tab === t ? 'bg-white/10' : ''}`}
                  >
                    <Text className={`font-semibold ${tab === t ? 'text-white' : 'text-zinc-500'}`}>
                      {t === 'IN' ? 'Money In' : t === 'OUT' ? 'Money Out' : 'Loans'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </BlurView>
            </View>
          </View>

          {/* Amount Input */}
          <View className="px-6 items-center mb-10">
            <Text className="text-zinc-500 text-xs font-medium tracking-wider uppercase mb-4">Amount (KES)</Text>
            <TextInput 
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
              placeholder="0"
              placeholderTextColor="#3f3f46"
              className="text-6xl font-bold text-white text-center w-full tracking-tight"
              style={{ fontVariant: ['tabular-nums'] }}
            />
          </View>

          {/* Contextual Inputs */}
          <View className="px-6">
            {tab === 'IN' && (
              <View className="mb-8">
                <Text className="text-zinc-400 text-xs font-medium tracking-wider uppercase mb-4">Source Bank/Wallet</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {KENYAN_BANKS.map(bank => (
                    <TouchableOpacity 
                      key={bank}
                      onPress={() => setSelectedBank(bank)}
                      className={`px-5 py-3 rounded-2xl border active:opacity-70 ${
                        selectedBank === bank 
                          ? 'bg-[#007AFF] border-[#007AFF]' 
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      <Text className="text-white font-semibold">{bank}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {tab === 'OUT' && (
              <View className="mb-8">
                <Text className="text-zinc-400 text-xs font-medium tracking-wider uppercase mb-4">Category</Text>
                <View className="flex-row flex-wrap gap-2">
                  {Object.values(CATEGORIES).filter(c => !c.id.includes('loan') && c.id !== 'income').map(cat => (
                    <TouchableOpacity 
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      className={`px-5 py-3 rounded-2xl border active:opacity-70 ${
                        selectedCategory === cat.id 
                          ? 'bg-[#007AFF] border-[#007AFF]' 
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      <Text className="text-white font-semibold">{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {tab === 'LOAN' && (
              <View className="mb-8">
                <View 
                  className="rounded-2xl overflow-hidden p-1 mb-6"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <BlurView intensity={20} tint="dark" style={{ flexDirection: 'row', borderRadius: 12 }}>
                    <TouchableOpacity 
                      onPress={() => setLoanMode('NEW')} 
                      className={`flex-1 py-3 items-center rounded-xl ${loanMode === 'NEW' ? 'bg-white/10' : ''}`}
                    >
                      <Text className={`font-semibold ${loanMode === 'NEW' ? 'text-white' : 'text-zinc-500'}`}>Take Loan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setLoanMode('PAY')} 
                      className={`flex-1 py-3 items-center rounded-xl ${loanMode === 'PAY' ? 'bg-white/10' : ''}`}
                    >
                      <Text className={`font-semibold ${loanMode === 'PAY' ? 'text-white' : 'text-zinc-500'}`}>Repay Loan</Text>
                    </TouchableOpacity>
                  </BlurView>
                </View>

                {loanMode === 'PAY' && (
                  <View>
                    <Text className="text-zinc-400 text-xs font-medium tracking-wider uppercase mb-4">Select Loan</Text>
                    {loans.filter((l:any) => !l.isSettled).map((l:any) => (
                      <TouchableOpacity 
                        key={l.id} 
                        onPress={() => setSelectedLoanId(l.id)}
                        className={`mb-3 rounded-2xl overflow-hidden border ${
                          selectedLoanId === l.id 
                            ? 'border-pink-500' 
                            : 'border-white/20'
                        }`}
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        <BlurView intensity={20} tint="dark" style={{ padding: 16 }}>
                          <Text className="text-white font-bold text-base mb-1">{l.name}</Text>
                          <Text className="text-zinc-400 text-sm">Due: {formatCurrency(l.principal - l.paid)}</Text>
                        </BlurView>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Note Input */}
            <View className="mb-8">
              <Text className="text-zinc-400 text-xs font-medium tracking-wider uppercase mb-4">Description / Note</Text>
              <View 
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <BlurView intensity={20} tint="dark">
                  <TextInput 
                    value={note}
                    onChangeText={setNote}
                    placeholder={loanMode === 'NEW' && tab === 'LOAN' ? "Loan Provider (e.g. M-Shwari)" : "Add details..."}
                    placeholderTextColor="#52525b"
                    className="text-white p-4 text-base"
                    multiline
                  />
                </BlurView>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              onPress={handleSubmit}
              className="bg-[#007AFF] py-4 rounded-2xl items-center mb-8 active:opacity-80"
              style={{ shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }}
            >
              <Text className="text-white font-bold text-base">Confirm Transaction</Text>
            </TouchableOpacity>

            <View className="h-12" /> 
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}