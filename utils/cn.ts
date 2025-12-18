// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges tailwind classes safely.
 * 
 * Usage:
 * cn("bg-red-500", isTrue && "p-4", "p-2") 
 * // Result: "bg-red-500 p-2" (p-2 overrides p-4 correctly)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}