🇰🇪 DebtTracker & Finance Vault
A privacy-first, Kenyan-focused personal finance manager built with React Native (Expo).
This app moves beyond simple expense logging. It calculates your Burn Rate, manages Recurring Bills, tracks Loans, and tells you exactly how much is "Safe To Spend" after your commitments are met.
Features
 Safe-to-Spend Analysis: Automatically subtracts unpaid bills and debt from your cash to show your real spending power.
 Burn Rate Indicator: Visual health check (Healthy/Caution/Overspending) based on your monthly income vs. expenses.
 Kenyan Banking Context: Pre-configured with major Kenyan banks (M-Pesa, Equity, KCB, Co-op, etc.) and Mobile Wallets.
 Bill & Subscription Management: Track recurring costs like Rent, WiFi, and Showmax.
 Debt Tracker: Manage loans (incoming) and repayments (outgoing) with progress bars.
 Biometric Security: Opt-in FaceID/Fingerprint lock to protect your financial data.
 Glassmorphism UI: A premium "Apple-esque" Dark Mode design using blurs and gradients.
 100% Local Storage: No servers. Your data lives on your device (AsyncStorage) for maximum privacy.
csv Data Export: Export your transaction history to CSV for Excel/Google Sheets.
🛠 Tech Stack
Framework: Expo (React Native)
Routing: Expo Router (File-based routing)
Styling: NativeWind v2 (Tailwind CSS for React Native)
State Management: React Context API
Persistence: @react-native-async-storage/async-storage
Charts: react-native-chart-kit
Security: expo-local-authentication
UI Components: expo-blur, expo-linear-gradient
 Getting Started
Prerequisites
Node.js (LTS version recommended).
JDK 17: Required for building on Android.
Expo Go app installed on your phone.
Installation
Clone the repository:
code
Bash
git clone https://github.com/mfalme0/debt-tracker.git
cd debt-tracker
Install dependencies:
code
Bash
npm install
Important: Ensure you have the correct NativeWind version (v2.0.11) and Tailwind (3.3.2) to avoid build errors:
code
Bash
npm install nativewind@2.0.11 tailwindcss@3.3.2
Start the app:
code
Bash
npx expo start --clear
Project Structure
code
Code
/
├── app/                  # Expo Router Screens
│   ├── _layout.tsx       # Main Navigation & Theme Provider
│   ├── index.tsx         # Dashboard (Burn Rate, Cards)
│   ├── add.tsx           # Add Transaction/Loan Modal
│   ├── onboarding.tsx    # Setup Wizard
│   └── settings.tsx      # Config & Data Management
│
├──
│── components/       # Reusable UI
│   │   ├── GlassCard.tsx # Frosted glass containers
│   │   └── QuickAction.tsx
│   │
│   ├── context/          # State Management
│   │   └── FinanceContext.tsx # Logic for Math & Storage
│   │
│   └── services/
│       └── storage.ts    # Async Storage wrapper
│
├── babel.config.js       # NativeWind Plugin Config
└── tailwind.config.js    # Styling Config
 Configuration Notes
NativeWind (Tailwind)
We are using NativeWind v2 for stability. If you see "Async Plugin" errors, ensure your babel.config.js looks like this (NativeWind as a plugin, not a preset):
code
JavaScript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel", 
      "react-native-reanimated/plugin",
    ],
  };
};
Android Build
If you encounter No Java compiler found when running npx expo run:android, ensure you have JDK 17 installed and your JAVA_HOME environment variable is set correctly.
 Usage Guide
Onboarding: Upon first launch, you will be asked for your Name, Income, and Recurring Bills.
Dashboard:
Total Balance: Your raw cash at hand.
Safe To Spend: Cash minus (Unpaid Bills + Active Debt).
Health Indicator: Shows if your expenses are eating up too much of your income.
Adding Data:
Tap "Add" for Income (Salary, M-Pesa deposits).
Tap "Pay Bill" for Expenses (Rent, Food).
Tap "Loan" to borrow money or repay a debt.
Reset: To clear data, go to Profile -> Settings -> Reset All Data.
 Future Roadmap

M-Pesa Automation: Auto-read SMS to update balances (Requires Development Build).

Budget Categories: Set limits for specific categories like "Entertainment".

Cloud Sync: Optional encrypted backup to Google Drive.

Daraja/ PesaLink intergration for payment within the app.
