'use client';
import React from 'react';

const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

interface DateFields {
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
}

interface MonthYearPickerProps extends DateFields {
  onChange: (fields: Partial<DateFields>) => void;
  allowPresent?: boolean;
  presentLabel?: string;
}

const selectCls =
  'w-full rounded-xl border border-violet-400/25 bg-white/[0.06] p-3.5 text-[15px] text-white outline-none transition-all duration-200 focus:border-violet-400/70 focus:bg-white/[0.10] focus:ring-2 focus:ring-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed';

const yearInputCls = selectCls + ' placeholder:text-slate-500';

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  startMonth,
  startYear,
  endMonth,
  endYear,
  onChange,
  allowPresent = true,
  presentLabel = 'I currently work here',
}) => {
  const isPresent = endYear === 'Present';

  return (
    <div className="w-full space-y-1.5 sm:col-span-2">
      <label className="ml-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
        Duration
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr]">
        <select
          value={startMonth || ''}
          onChange={(e) => onChange({ startMonth: e.target.value })}
          className={selectCls}
        >
          <option value="" className="bg-slate-900">Start Month</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value} className="bg-slate-900">
              {m.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          inputMode="numeric"
          value={startYear || ''}
          onChange={(e) => onChange({ startYear: e.target.value })}
          placeholder="Start Year"
          className={yearInputCls}
        />

        <select
          value={isPresent ? '' : (endMonth || '')}
          disabled={isPresent}
          onChange={(e) => onChange({ endMonth: e.target.value })}
          className={selectCls}
        >
          <option value="" className="bg-slate-900">End Month</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value} className="bg-slate-900">
              {m.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          inputMode="numeric"
          value={isPresent ? '' : (endYear || '')}
          disabled={isPresent}
          onChange={(e) => onChange({ endYear: e.target.value })}
          placeholder="End Year"
          className={yearInputCls}
        />
      </div>

      {allowPresent && (
        <label className="ml-1 mt-1 flex w-fit items-center gap-2 text-xs font-medium text-violet-300/70">
          <input
            type="checkbox"
            checked={isPresent}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? { endMonth: '', endYear: 'Present' }
                  : { endMonth: '', endYear: '' }
              )
            }
            className="h-3.5 w-3.5 rounded border-violet-400/40 bg-white/[0.06] text-violet-500 accent-violet-500 focus:ring-violet-500/40"
          />
          {presentLabel}
        </label>
      )}
    </div>
  );
};
