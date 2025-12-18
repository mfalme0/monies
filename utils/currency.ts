export const formatCurrency = (amount: number) =>{
    return new Intl.NumberFormat('en-Ke', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
    }).format(amount);
};

export const KENYAN_BANKS = [
  "M-Pesa", "Cash","Absa", "Equity Bank", "KCB", "Co-operative Bank", 
  "NCBA", "Stanbic", "I&M", "Standard Chartered"
];


export const CATEGORIES = {
  INCOME: { id: 'income', label: 'Income', color: '#10B981' },
  RENT: { id: 'rent', label: 'Rent', color: '#3B82F6' },
  UTILITIES: { id: 'utilities', label: 'Utilities', color: '#F59E0B' },
  FOOD: { id: 'food', label: 'Food & Dining', color: '#EF4444' },
  ENTERTAINMENT: { id: 'entertainment', label: 'Entertainment', color: '#8B5CF6' },
  LOAN_DISBURSEMENT: { id: 'loan_in', label: 'Loan Taken', color: '#6366F1' },
  LOAN_REPAYMENT: { id: 'loan_out', label: 'Loan Repayment', color: '#EC4899' },
  MISC: { id: 'misc', label: 'Misc', color: '#64748B' },
};