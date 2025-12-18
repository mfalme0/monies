import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../utils/cn';

export const GlassCard = ({ children, className, intensity = 20, variant = 'default' }: any) => {
  const isAndroid = Platform.OS === 'android';

  // "Featured" cards (like the main balance) get a slight blue tint
  const gradientColors = variant === 'featured' 
    ? ['rgba(30, 58, 138, 0.5)', 'rgba(0,0,0,0.4)'] // Blueish to dark
    : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']; // White fade

  const Container = ({ children }: any) => (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      {children}
    </LinearGradient>
  );

  return (
    <View 
      className={cn(
        "rounded-3xl overflow-hidden border border-white/10 relative",
        isAndroid ? "bg-zinc-900 shadow-2xl shadow-black" : "bg-transparent", 
        className 
      )}
    >
      {isAndroid ? (
        // Android: Gradient Background simulation
        <LinearGradient
           colors={['#1c1c1e', '#000000']}
           start={{ x: 0, y: 0 }}
           end={{ x: 0, y: 1 }}
           className="flex-1 p-5"
        >
          {children}
        </LinearGradient>
      ) : (
        // iOS: Real Blur
        <BlurView intensity={intensity} tint="dark" className="flex-1">
          <LinearGradient
             colors={['rgba(255,255,255,0.05)', 'transparent']}
             className="flex-1 p-5"
          >
             {children}
          </LinearGradient>
        </BlurView>
      )}
    </View>
  );
};