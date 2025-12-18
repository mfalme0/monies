import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';

const BALANCE_REGEX = /New M-PESA balance is KSh([\d,]+\.\d{2})/i;

export const MpesaService = {
  
  // 1. Ask for Permission
  async requestPermission() {
    if (Platform.OS !== 'android') return false;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "M-Pesa Sync",
          message: "We need to read your M-Pesa messages to verify your balance automatically.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  },

  // 2. Read Latest Balance
  async getLatestBalance(): Promise<number | null> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return null;

    return new Promise((resolve) => {
      // Filter for SMS from "MPESA"
      const filter = {
        box: 'inbox',
        address: 'MPESA', 
        maxCount: 10, // Only check last 10 messages for speed
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: any) => {
          console.log('Failed to read SMS:', fail);
          resolve(null);
        },
        (count: number, smsList: string) => {
          const messages = JSON.parse(smsList);
          
          // Find the newest message with a balance
          for (let msg of messages) {
            const body = msg.body;
            const match = body.match(BALANCE_REGEX);
            
            if (match && match[1]) {
              // Remove commas (e.g., "4,500.00" -> "4500.00")
              const cleanBalance = parseFloat(match[1].replace(/,/g, ''));
              resolve(cleanBalance);
              return;
            }
          }
          resolve(null); // No balance found in recent messages
        }
      );
    });
  }
};