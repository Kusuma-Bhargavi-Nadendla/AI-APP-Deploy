import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
const CATEGORY_COLORS = [
  'bg-blue-50', 'bg-blue-100',
  'bg-green-50', 'bg-green-100', 
  'bg-purple-50', 'bg-purple-100',
  'bg-pink-50', 'bg-pink-100',
  'bg-indigo-50', 'bg-indigo-100',
  'bg-teal-50', 'bg-teal-100',
  'bg-cyan-50', 'bg-cyan-100',
  'bg-amber-50', 'bg-amber-100',
  'bg-emerald-50', 'bg-emerald-100',
  'bg-violet-50', 'bg-violet-100',
  'bg-rose-50', 'bg-rose-100',
  'bg-sky-50', 'bg-sky-100',
  'bg-lime-50', 'bg-lime-100',
  'bg-fuchsia-50', 'bg-fuchsia-100'
];

const usedColors = new Set<string>();

export const getRandomColor = (): string => {
  if (usedColors.size >= CATEGORY_COLORS.length) {
    usedColors.clear();
  }

  const availableColors = CATEGORY_COLORS.filter(color => !usedColors.has(color));
  
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  const selectedColor = availableColors[randomIndex];
  
  usedColors.add(selectedColor);
  
  return selectedColor;
};

export const resetColorTracker = () => {
  usedColors.clear();
};