import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORY_COLORS = [
  'bg-blue-50', 
  'bg-green-50',  
  'bg-amber-50',  
  'bg-rose-50',   
  'bg-emerald-50',  
  'bg-purple-50',    
  'bg-lime-50',     
  'bg-fuchsia-50',  
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


