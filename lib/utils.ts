import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Supabase returns timestamps without timezone suffix (e.g. "2026-06-03T01:19:00").
// JavaScript treats these as LOCAL time, not UTC. We must append 'Z' so they're
// correctly parsed as UTC before converting to PH display time.
type DateInput = string | Date | null | undefined;

function parseSupabaseDate(input: DateInput): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  const iso = input.replace(' ', 'T');
  const withTz = (iso.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(iso)) ? iso : iso + 'Z';
  return new Date(withTz);
}

export function formatPHTime(input: DateInput): string {
  const date = parseSupabaseDate(input);
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Manila',
  });
}

export function formatPHDateTime(input: DateInput): string {
  const date = parseSupabaseDate(input);
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Manila',
  });
}

export function formatPHDate(input: DateInput): string {
  const date = parseSupabaseDate(input);
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'Asia/Manila',
  });
}

// "Today" / "Yesterday" / "Jun 4, 2026" (PH timezone). With withTime, appends " at 10:30 AM".
export function formatPHRelativeDate(input: DateInput, withTime = false): string {
  const date = parseSupabaseDate(input);
  if (!date || isNaN(date.getTime())) return 'N/A';
  const keyOf = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000);
  const k = keyOf(date);
  const label = k === keyOf(now) ? 'Today' : k === keyOf(yesterday) ? 'Yesterday' : formatPHDate(date);
  return withTime ? `${label} at ${formatPHTime(date)}` : label;
}
