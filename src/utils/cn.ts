export function cn(...parts: (string | number | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}
