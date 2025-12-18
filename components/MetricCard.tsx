import React from 'react';
import { View, Text } from 'react-native';
import { GlassCard } from './GlassCard';
import { formatCurrency } from '../utils/currency';

export const MetricCard = ({ title, amount, subtitle, color = "text-white" }: any) => (
  <GlassCard className="w-[85vw] mr-4 h-48 justify-center">
    <Text className="text-gray-400 text-xs font-bold tracking-[2px] uppercase mb-2">{title}</Text>
    <Text className={`text-4xl font-extrabold ${color}`}>
      {formatCurrency(amount)}
    </Text>
    {subtitle && <Text className="text-gray-500 mt-2 text-sm">{subtitle}</Text>}
  </GlassCard>
);