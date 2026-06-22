import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSummary(value: unknown): string {
  if (typeof value === "string") {
    return value.trim()
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .filter((item): item is string => typeof item === "string")
      .map((s) => s.replace(/^[\"\[\]]+|[\"\[\]]+$/g, "").trim())
      .filter((s) => s.length > 0)

    return cleaned.join(". ")
  }

  return ""
}
