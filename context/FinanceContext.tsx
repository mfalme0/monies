import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { storage } from '../services/storage';

// Types
type Transaction = { id: string; type: 'in' | 'out'; category: string; amount: number; date: string; note?: string; bank?: string; relatedLoanId?: string; };
type Account = { id: string; name: string; balance: number; type: 'bank' | 'mobile' | 'cash'; };
type Loan = { id: string; name: string; principal: number; paid: number; isSettled: boolean; date: string; };
type Bill = { name: string; amount: number; }; // <--- New Type

const FinanceContext = createContext<any>(null);

export const FinanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [recurringBills, setRecurringBills] = useState<Bill[]>([]); // <--- New State
  
  const [username, setUsername] = useState<string | null>(null);
  const [payWeek, setPayWeek] = useState<string>('4');
  
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txs, accts, lns, bills, sec, onboardStatus, user, week] = await Promise.all([
        storage.get<Transaction[]>('transactions'),
        storage.get<Account[]>('accounts'),
        storage.get<Loan[]>('loans'),
        storage.get<Bill[]>('recurringBills'), // <--- Load Bills
        storage.get<boolean>('security'),
        storage.get<boolean>('isOnboarded'),
        storage.get<string>('username'),
        storage.get<string>('payWeek')
      ]);

      if (txs) setTransactions(txs);
      if (accts) setAccounts(accts);
      if (lns) setLoans(lns);
      if (bills) setRecurringBills(bills); // <--- Set Bills
      if (sec !== null) setSecurityEnabled(sec);
      if (onboardStatus === true) setIsOnboarded(true);
      if (user) setUsername(user);
      if (week) setPayWeek(week);
      
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  };

  const updateState = (accts: Account[], txs: Transaction[], lns: Loan[]) => {
    setAccounts(accts);
    setTransactions(txs);
    setLoans(lns);
    storage.set('accounts', accts);
    storage.set('transactions', txs);
    storage.set('loans', lns);
  };

  // --- ACTIONS ---

  const addIncome = async (bankName: string, amount: number, note: string) => {
    const newAccounts = [...accounts];
    const existingIndex = newAccounts.findIndex(a => a.name === bankName);
    
    if (existingIndex >= 0) {
      newAccounts[existingIndex].balance += amount;
    } else {
      newAccounts.push({ id: Date.now().toString(), name: bankName, balance: amount, type: 'bank' });
    }
    
    const newTx: Transaction = { id: Date.now().toString(), type: 'in', category: 'income', amount, date: new Date().toISOString(), bank: bankName, note };
    updateState(newAccounts, [newTx, ...transactions], loans);
  };

  const addExpense = async (category: string, amount: number, note: string) => {
    let remaining = amount;
    const newAccounts = accounts.map(acc => {
      if (remaining <= 0) return acc;
      const deduction = Math.min(acc.balance, remaining);
      remaining -= deduction;
      return { ...acc, balance: acc.balance - deduction };
    });

    const newTx: Transaction = { id: Date.now().toString(), type: 'out', category, amount, date: new Date().toISOString(), note };
    updateState(newAccounts, [newTx, ...transactions], loans);
  };

  // ... (addLoan and repayLoan remain the same) ...
  const addLoan = async (name: string, principal: number) => {
    const newLoan: Loan = { id: Date.now().toString(), name, principal, paid: 0, isSettled: false, date: new Date().toISOString() };
    const newTx: Transaction = { id: Date.now().toString(), type: 'in', category: 'loan_in', amount: principal, date: new Date().toISOString(), note: `Loan: ${name}` };
    const newAccounts = [...accounts];
    if (newAccounts.length > 0) newAccounts[0].balance += principal;
    updateState(newAccounts, [newTx, ...transactions], [...loans, newLoan]);
  };

  const repayLoan = async (loanId: string, amount: number) => {
    const loanIndex = loans.findIndex(l => l.id === loanId);
    if (loanIndex === -1) return;
    const newLoans = [...loans];
    newLoans[loanIndex].paid += amount;
    if (newLoans[loanIndex].paid >= newLoans[loanIndex].principal) newLoans[loanIndex].isSettled = true;
    
    let remaining = amount;
    const newAccounts = accounts.map(acc => {
      if (remaining <= 0) return acc;
      const deduction = Math.min(acc.balance, remaining);
      remaining -= deduction;
      return { ...acc, balance: acc.balance - deduction };
    });

    const newTx: Transaction = { id: Date.now().toString(), type: 'out', category: 'loan_out', amount, date: new Date().toISOString(), relatedLoanId: loanId, note: `Repayment` };
    updateState(newAccounts, [newTx, ...transactions], newLoans);
  };

  const completeOnboarding = async (
    name: string,
    selectedBanks: string[], 
    salary: number, 
    week: string,
    bills: Bill[]
  ) => {
    // 1. Setup Banks
    const initialAccounts = selectedBanks.map(bank => ({
      id: Date.now().toString() + Math.random(),
      name: bank,
      balance: 0, 
      type: 'bank' as const
    }));

    // 2. USE THE DATA: Apply Salary to the first account (or Cash)
    if (salary > 0) {
      if (initialAccounts.length > 0) {
        initialAccounts[0].balance = salary;
      } else {
        initialAccounts.push({ id: 'cash', name: 'Cash', balance: salary, type: 'cash' });
      }
    }

    // 3. USE THE DATA: Store the bills
    setAccounts(initialAccounts);
    setRecurringBills(bills);
    setUsername(name);
    setPayWeek(week);
    
    // 4. Save to Storage
    await storage.set('accounts', initialAccounts);
    await storage.set('recurringBills', bills);
    await storage.set('username', name);
    await storage.set('payWeek', week);
    await storage.set('isOnboarded', true);
    
    setIsOnboarded(true);
  };
  
  const clearAllData = async () => {
      // ... (existing clear logic) ...
      await storage.set('accounts', []);
      await storage.set('transactions', []);
      await storage.set('loans', []);
      await storage.set('recurringBills', []);
      await storage.set('security', false);
      await storage.set('isOnboarded', false);
      
      setAccounts([]);
      setTransactions([]);
      setLoans([]);
      setRecurringBills([]);
      setSecurityEnabled(false);
      setIsOnboarded(false);
      return true;
  };

  // --- CALCULATION LOGIC ---
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalDebt = loans.filter(l => !l.isSettled).reduce((sum, l) => sum + (l.principal - l.paid), 0);
  
  // NEW: Calculate Monthly Bill Commitments
  // Logic: "Safe to Spend" = Cash - (Bills I haven't paid yet this month) - Debt
  // For simplicity: Effective = Cash - Bills - Debt
  const totalMonthlyBills = recurringBills.reduce((sum, b) => sum + b.amount, 0);
  
  // Find which bills are already paid this month
  const currentMonth = new Date().getMonth();
  const paidBillsAmount = transactions
    .filter(t => t.type === 'out' && new Date(t.date).getMonth() === currentMonth && ['rent', 'utilities'].includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0);

  // We assume the bills entered in onboarding match the 'utilities'/'rent' categories
  // Remaining Bills = Total Bills - Amount Paid (clamped to 0)
  const remainingBills = Math.max(0, totalMonthlyBills - paidBillsAmount);

  const effectiveBalance = totalBalance - remainingBills - totalDebt;

  return (
    <FinanceContext.Provider value={{
      accounts, transactions, loans, recurringBills, loading, isOnboarded, username, payWeek,
      addIncome, addExpense, addLoan, repayLoan, completeOnboarding, clearAllData,
      totalBalance, totalDebt, effectiveBalance, remainingBills, totalMonthlyBills, // Export these new values
      securityEnabled, setSecurityEnabled, isAuthenticated, setIsAuthenticated
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);