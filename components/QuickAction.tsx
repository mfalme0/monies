import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const QuickAction = ({ icon, label, onPress, color = "bg-zinc-800" }: any) => (
  <TouchableOpacity onPress={onPress} className="items-center space-y-2">
    <View className={`w-16 h-16 ${color} rounded-full items-center justify-center border border-white/5`}>
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text className="text-zinc-400 text-xs font-medium">{label}</Text>
  </TouchableOpacity>
);