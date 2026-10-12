import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';

/** Six single-digit inputs: auto-advance, backspace goes back, arrow keys move, paste fills all. */
export function OtpInput({ value, onChange, invalid, describedBy }: { value: string; onChange: (v: string) => void; invalid?: boolean; describedBy?: string }) {
  const { d, t, formatNumber } = useI18n();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const setAt = (i: number, ch: string) => {
    const arr = digits.slice();
    arr[i] = ch;
    onChange(arr.join('').slice(0, 6));
  };
  const focus = (i: number) => refs.current[Math.max(0, Math.min(5, i))]?.focus();

  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i]) {
      e.preventDefault();
      setAt(i - 1, '');
      focus(i - 1);
    } else if (e.key === 'ArrowLeft') focus(i - 1);
    else if (e.key === 'ArrowRight') focus(i + 1);
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    focus(text.length);
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-describedby={describedBy}>
      {digits.map((ch, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={ch}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={t(d.auth.otpLabel, { n: formatNumber(i + 1) })}
          aria-invalid={invalid || undefined}
          onPaste={onPaste}
          onKeyDown={onKey(i)}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            setAt(i, v);
            if (v) focus(i + 1);
          }}
          className={cn(
            'tnum h-14 w-full min-w-0 rounded-control border bg-surface text-center text-[1.375rem] font-semibold text-ink transition-[border-color,box-shadow] focus:border-brand focus:shadow-focus focus:outline-none',
            invalid ? 'border-bad/70' : 'border-line',
          )}
        />
      ))}
    </div>
  );
}
