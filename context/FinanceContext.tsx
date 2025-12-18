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

 // Inside src/context/FinanceContext.tsx

  const loadData = async () => {
    try {
      const [txs, accts, lns, bills, sec, onboardStatus, user, week] = await Promise.all([
        storage.get<Transaction[]>('transactions'),
        storage.get<Account[]>('accounts'),
        storage.get<Loan[]>('loans'),
        storage.get<Bill[]>('recurringBills'),
        storage.get<boolean>('security'),
        storage.get<boolean>('isOnboarded'),
        storage.get<string>('username'),
        storage.get<string>('payWeek')
      ]);

      // --- THE FIX: SANITIZE DATA ON LOAD ---
      
      // 1. Clean Bills: Ensure amount is a Number
      if (bills) {
        const cleanBills = bills.map(b => ({
          ...b,
          amount: parseFloat(b.amount as any) || 0 // Force convert string to number
        }));
        setRecurringBills(cleanBills);
      }

      // 2. Clean Accounts: Ensure balance is a Number
      if (accts) {
        const cleanAccounts = accts.map(a => ({
          ...a,
          balance: parseFloat(a.balance as any) || 0
        }));
        setAccounts(cleanAccounts);
      }

      // 3. Clean Loans
      if (lns) {
        const cleanLoans = lns.map(l => ({
          ...l,
          principal: parseFloat(l.principal as any) || 0,
          paid: parseFloat(l.paid as any) || 0
        }));
        setLoans(cleanLoans);
      }

      if (txs) setTransactions(txs);
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

 // Inside FinanceContext.tsx

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

    // 2. Add Salary AND Create Transaction
    const initialTransactions: Transaction[] = []; // <--- Create array

    if (salary > 0) {
      // Update Balance
      if (initialAccounts.length > 0) {
        initialAccounts[0].balance = salary;
      } else {
        initialAccounts.push({ id: 'cash', name: 'Cash', balance: salary, type: 'cash' });
      }

      // Create "Salary" Transaction Record <--- THE FIX
      initialTransactions.push({
        id: 'init-salary',
        type: 'in',
        category: 'income',
        amount: salary,
        date: new Date().toISOString(),
        bank: initialAccounts[0]?.name || 'Cash',
        note: 'Initial Salary'
      });
    }

    // 3. Save to State
    setAccounts(initialAccounts);
    setTransactions(initialTransactions); // <--- Set Transactions
    setRecurringBills(bills);
    setUsername(name);
    setPayWeek(week);
    
    // 4. Save to Storage
    await storage.set('accounts', initialAccounts);
    await storage.set('transactions', initialTransactions); // <--- Save Transactions
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
  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  
  const totalDebt = loans
    .filter(l => !l.isSettled)
    .reduce((sum, l) => sum + ((Number(l.principal) || 0) - (Number(l.paid) || 0)), 0);
  
  // 2. Fix the specific bug you are seeing (Bills compounding as text)
  const totalMonthlyBills = recurringBills.reduce((sum, b) => {
    return sum + (Number(b.amount) || 0); // <--- The Fix: Number() wrapper
  }, 0);
  
  // 3. Calculate paid bills
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const paidBillsAmount = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'out' && 
             d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear &&
             ['rent', 'utilities'].includes(t.category);
    })
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 4. Final Safe Calculations
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