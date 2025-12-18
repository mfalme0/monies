import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { BlurView } from 'expo-blur';

import { useFinance } from '../../context/FinanceContext';
import { GlassCard } from '../../components/GlassCard';
import { QuickAction } from '../../components/QuickAction';
import { CATEGORIES, formatCurrency } from '../../utils/currency';

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const { 
    totalBalance, effectiveBalance, transactions, totalMonthlyBills, remainingBills, recurringBills,
    securityEnabled, isAuthenticated, setIsAuthenticated, loading 
  } = useFinance();

  const [refreshing, setRefreshing] = useState(false);  

  const getBillCategory = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('rent') || lower.includes('house')) return 'rent';
    if (lower.includes('food') || lower.includes('eat') || lower.includes('dinner')) return 'food';
    if (lower.includes('wifi') || lower.includes('net') || lower.includes('data') || lower.includes('airtime') || lower.includes('token') || lower.includes('power') || lower.includes('water')) return 'utilities';
    if (lower.includes('showmax') || lower.includes('netflix') || lower.includes('fun')) return 'entertainment';
    return 'utilities'; // Default fallback
  };

  useEffect(() => {
    if (!loading && securityEnabled && !isAuthenticated) {
      authenticate();
    }
  }, [loading, securityEnabled]);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (hasHardware) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Vault',
          fallbackLabel: 'Enter PIN',
          disableDeviceFallback: false,
          cancelLabel: 'Cancel'
        });
        if (result.success) {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.log("Auth Error", e);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // --- BURN RATE CALCULATION ---
  const calculateBurnRate = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Get this month's transactions
    const monthlyTx = transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // 2. Sum Income (Exclude loans to see real earning power)
    const income = monthlyTx
      .filter((t: any) => t.type === 'in' && t.category !== 'loan_in')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // 3. Sum Expenses
    const expenses = monthlyTx
      .filter((t: any) => t.type === 'out')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // 4. Calculate %
    if (income === 0) return { rate: 0, income: 0, expenses }; // Avoid division by zero
    return { rate: (expenses / income) * 100, income, expenses };
  };

const { rate, income, expenses } = calculateBurnRate();
  
  // Determine Health Status
  let healthColor = "#52525b"; // Default Gray (Zinc-600)
  let healthIcon = "help-circle";
  let healthText = "No Activity";

  if (income === 0 && expenses === 0) {
     // Keep default "No Activity"
  } else if (rate <= 50) {
    healthColor = "#10B981"; // Green
    healthIcon = "checkmark-circle";
    healthText = "Healthy";
  } else if (rate > 50 && rate <= 80) {
    healthColor = "#F59E0B"; // Yellow
    healthIcon = "warning";
    healthText = "Caution";
  } else {
    healthColor = "#EF4444"; // Red
    healthIcon = "alert-circle";
    healthText = "Overspending";
  }


  if (loading) {
    return (
      <View className="flex-1 bg-[#0a0a0a] justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-zinc-500 mt-4 text-sm font-medium">Decrypting Vault...</Text>
      </View>
    );
  }

  if (securityEnabled && !isAuthenticated) {
    return (
      <View className="flex-1 bg-[#0a0a0a] justify-center items-center px-8">
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <View className="w-24 h-24 bg-white/5 rounded-3xl items-center justify-center mb-8 border border-white/10">
          <Ionicons name="lock-closed" size={40} color="#007AFF" />
        </View>
        <Text className="text-white text-2xl font-semibold mb-3 tracking-tight">Vault Locked</Text>
        <Text className="text-zinc-400 text-center text-base mb-12 leading-6">
          Identity verification is required to access your financial data.
        </Text>
        
        <TouchableOpacity 
          onPress={authenticate}
          className="bg-[#007AFF] w-full py-4 rounded-2xl items-center active:opacity-80"
          style={{ shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }}
        >
          <Text className="text-white font-semibold text-base">Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pieData = Object.values(CATEGORIES)
    .filter(cat => ['rent', 'utilities', 'food', 'entertainment', 'loan_out'].includes(cat.id))
    .map(cat => {
      // 1. Calculate Actual Spend (Transactions)
      const actualSpend = transactions
        .filter((t: any) => t.category === cat.id && t.type === 'out')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // 2. Calculate Committed Bills (Onboarding)
      const committedBills = recurringBills
        .filter((b: any) => getBillCategory(b.name) === cat.id)
        .reduce((sum: number, b: any) => sum + b.amount, 0);

      // 3. Smart Merge: Show the GREATER of the two.
      // Logic: If I haven't paid rent (Trans=0), show Bill (15k). 
      //        If I paid rent (Trans=15k), show Trans (15k).
      //        This prevents double counting.
      const total = Math.max(actualSpend, committedBills);

      return {
        name: cat.label,
        amount: total,
        color: cat.color,
        legendFontColor: "#d4d4d8",
        legendFontSize: 12
      };
    }).filter(d => d.amount > 0);

  const recentTransactions = [...transactions].sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor="#007AFF" />}
      >
        
        {/* Header */}
        <View className="px-6 pt-16 pb-8 flex-row justify-between items-center">
          <View>
             <Text className="text-zinc-500 font-medium text-xs tracking-wide uppercase mb-2">
               {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
             </Text>
             <Text className="text-white text-[34px] font-bold tracking-tight leading-tight">{getGreeting()}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/settings')} 
            className="w-11 h-11 rounded-full bg-white/10 border border-white/20 items-center justify-center active:opacity-70"
          >
             <Ionicons name="person" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Balance Cards */}
      <ScrollView 
  horizontal 
  showsHorizontalScrollIndicator={false} 
  contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
  className="mb-8"
>
  {/* Card 1: Total Cash */}
  <View 
    className="w-[85vw] h-56 rounded-3xl overflow-hidden"
    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
  >
    <BlurView intensity={20} tint="dark" style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
       <View className="flex-row justify-between items-start">
          <View className="flex-1">
              <Text className="text-zinc-400 font-medium text-xs tracking-wider uppercase mb-3">Total Cash</Text>
              <Text className="text-white text-5xl font-bold tracking-tight">
                  {formatCurrency(totalBalance)}
              </Text>
          </View>
          <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20">
              <Ionicons name="wallet-outline" size={24} color="white" />
          </View>
       </View>
       <View>
          <Text className="text-zinc-500 text-xs">Total across all accounts</Text>
       </View>
    </BlurView>
  </View>

  {/* Card 2: Safe To Spend (Effective Balance) */}
  <View 
    className="w-[85vw] h-56 rounded-3xl overflow-hidden"
    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
  >
    <BlurView intensity={20} tint="dark" style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
       <View>
          <Text className="text-zinc-400 font-medium text-xs tracking-wider uppercase mb-3">Safe to Spend</Text>
          <Text className={`text-5xl font-bold tracking-tight ${effectiveBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(effectiveBalance)}
          </Text>
       </View>
       <View>
         <View className="flex-row justify-between mb-1">
            <Text className="text-zinc-400 text-xs">Unpaid Bills</Text>
            <Text className="text-white text-xs font-bold">{formatCurrency(remainingBills)}</Text>
         </View>
         <View className="h-1 bg-zinc-800 rounded-full w-full overflow-hidden">
            <View 
                style={{ width: `${(remainingBills / (totalMonthlyBills || 1)) * 100}%` }} 
                className="h-full bg-red-500" 
            />
         </View>
         <Text className="text-zinc-500 text-[10px] mt-2">Cash minus Unpaid Bills & Debt</Text>
       </View>
    </BlurView>
  </View>
</ScrollView>

        {/* --- NEW: BURN RATE INDICATOR --- */}
        <View className="px-6 mb-10">
          <View 
            className="flex-row items-center p-4 rounded-3xl border border-white/10"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
             {/* Circular Indicator */}
             <View 
               className="w-14 h-14 rounded-full items-center justify-center mr-4"
               style={{ backgroundColor: `${healthColor}20` }}
             >
                <Ionicons name={healthIcon as any} size={28} color={healthColor} />
             </View>

             {/* Text Info */}
             <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-white font-bold text-lg">{healthText}</Text>
                  <Text className="text-zinc-400 font-bold">{Math.round(rate)}% Burn</Text>
                </View>
                
                {/* Progress Bar */}
                <View className="h-2 bg-white/10 rounded-full overflow-hidden w-full mb-1">
                   <View 
                     style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: healthColor }} 
                     className="h-full rounded-full" 
                   />
                </View>
                
                <Text className="text-zinc-500 text-xs">
                   Spent {formatCurrency(expenses)} of {formatCurrency(income)} (This Month)
                </Text>
             </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between px-8 mb-10">
           <QuickAction 
             icon="add" 
             label="Add" 
             onPress={() => router.push({ pathname: '/add', params: { tab: 'IN' } })} 
             color="bg-[#007AFF]"
           />
           <QuickAction 
             icon="send" 
             label="Pay Bill" 
             onPress={() => router.push({ pathname: '/add', params: { tab: 'OUT' } })} 
           />
           <QuickAction 
             icon="cash" 
             label="Loan" 
             onPress={() => router.push({ pathname: '/add', params: { tab: 'LOAN' } })} 
           />
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-8">
            <Text className="text-white text-xl font-bold mb-4 tracking-tight">Recent Activity</Text>
            <View 
              className="rounded-3xl overflow-hidden"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <BlurView intensity={20} tint="dark" style={{ paddingHorizontal: 20 }}>
               {recentTransactions.length === 0 ? (
                   <Text className="text-zinc-500 text-center py-12 font-medium">No transactions yet.</Text>
               ) : (
                   recentTransactions.map((tx: any, index: number) => {
                       const isIncome = tx.type === 'in';
                       const category = Object.values(CATEGORIES).find(c => c.id === tx.category);
                       
                       return (
                           <View key={tx.id}>
                               <View className="flex-row justify-between items-center py-4">
                                   <View className="flex-row items-center gap-4 flex-1">
                                       <View className={`w-11 h-11 rounded-2xl items-center justify-center ${isIncome ? 'bg-emerald-500/20' : 'bg-rose-500/20'} border ${isIncome ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                                           <Ionicons 
                                            name={isIncome ? "arrow-down" : "arrow-up"} 
                                            size={20} 
                                            color={isIncome ? "#10B981" : "#F43F5E"} 
                                           />
                                       </View>
                                       <View className="flex-1">
                                           <Text className="text-white font-semibold text-base tracking-tight" numberOfLines={1}>
                                               {tx.note || category?.label || 'Transaction'}
                                           </Text>
                                           <Text className="text-zinc-500 text-sm mt-0.5">
                                               {new Date(tx.date).toLocaleDateString()}
                                           </Text>
                                       </View>
                                   </View>
                                   <Text className={`font-bold text-base ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                                       {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                                   </Text>
                               </View>
                               {index < recentTransactions.length - 1 && <View className="h-[1px] bg-white/10" />}
                           </View>
                       );
                   })
               )}
              </BlurView>
            </View>
        </View>

        {/* Analytics */}
        <View className="px-6 mb-32">
           <Text className="text-white text-xl font-bold mb-4 tracking-tight">Monthly Spend</Text>
           <View 
             className="rounded-3xl overflow-hidden"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
           >
             <BlurView intensity={20} tint="dark" style={{ padding: 20, alignItems: 'center' }}>
               {pieData.length > 0 ? (
                   <PieChart
                      data={pieData}
                      width={width - 80}
                      height={200}
                      chartConfig={{
                          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      }}
                      accessor={"amount"}
                      backgroundColor={"transparent"}
                      paddingLeft={"0"}
                      center={[10, 0]}
                      absolute
                    />
               ) : (
                   <View className="h-48 justify-center items-center w-full">
                       <View className="w-16 h-16 bg-white/5 rounded-2xl items-center justify-center mb-3 border border-white/10">
                         <Ionicons name="pie-chart-outline" size={32} color="#52525b" />
                       </View>
                       <Text className="text-zinc-500 font-medium">No spending data available</Text>
                   </View>
               )}
             </BlurView>
           </View>
        </View>

      </ScrollView>

      {/* FAB */}
      <View className="absolute bottom-10 left-0 right-0 items-center">
        <TouchableOpacity 
            onPress={() => router.push('/add')}
            className="w-16 h-16 rounded-full bg-[#007AFF] items-center justify-center border-2 border-white/20 active:opacity-80"
            style={{ shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 }}
        >
            <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}