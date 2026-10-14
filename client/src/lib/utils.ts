import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      hour12: true,
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const colorMap: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
  lime: "bg-lime-500",
  fuchsia: "bg-fuchsia-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  black: "bg-black text-white",
  white: "bg-white border border-gray-300 text-black",
  gray: "bg-gray-500",
  brown: "bg-amber-600",
  gold: "bg-yellow-400",
  silver: "bg-gray-300",
  cream: "bg-amber-50",
  beige: "bg-amber-100",
  tan: "bg-amber-200",
  maroon: "bg-red-700",
  navy: "bg-blue-800",
  olive: "bg-lime-700",
};

export const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);

export const genders = ["male", "female", "other"] as const;

export const errorParser = (parsed: any) => {
  const fieldErrors = parsed?.error?.flatten?.().fieldErrors;

  const errorMessages = Object.entries(fieldErrors)
    .filter(([_, messages]: any) => messages && messages.length > 0)
    .map(([field, messages]: [string, any]) => {
      const fieldName =
        field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
      return `• ${fieldName}: ${messages.join(", ")}`;
    })
    .join("\n");

  return errorMessages.trim();
};
