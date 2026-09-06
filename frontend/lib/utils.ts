import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateMiddle(value: string, front = 6, back = 4) {
  if (value.length <= front + back + 3) return value;
  return `${value.slice(0, front)}…${value.slice(-back)}`;
}
