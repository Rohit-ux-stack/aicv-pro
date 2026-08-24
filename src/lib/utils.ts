import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseDateValue = (month: string, year: string) => {
  if (!year) return 0;
  if (year.toLowerCase() === 'present') return Infinity; // Keeps current jobs at the top
  const monthVal = month ? parseInt(month) : 1; 
  return parseInt(year) * 12 + monthVal; 
};

export const sortChronologically = (items: any[]) => {
  return [...items].sort((a, b) => {
    // Sort by end date first, then start date if end dates match
    const aEnd = parseDateValue(a.endMonth, a.endYear);
    const bEnd = parseDateValue(b.endMonth, b.endYear);
    
    if (bEnd !== aEnd) return bEnd - aEnd;
    
    const aStart = parseDateValue(a.startMonth, a.startYear);
    const bStart = parseDateValue(b.startMonth, b.startYear);
    return bStart - aStart;
  });
};
