import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    async get<T>(key: string): Promise<T | null> {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) as T : null;
        } catch (e) {
            console.error('Error reading storage key:', key, e);
            return null;
        }
    },
    async set<T>(key:string, value: any){
        try{
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
        } catch(e){
            console.error('Error setting storage key:', key, e);    
        }
    }
};