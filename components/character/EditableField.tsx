'use client';

import { useState } from 'react';

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder: string;
  shortLabel: string;
  onChange: (value: string) => void;
}

export default function EditableField({
  label,
  value,
  placeholder,
  shortLabel,
  onChange,
}: EditableFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-academia-muted uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[9px] text-academia-muted/40">
          {shortLabel}
        </span>
      </div>
      <textarea
        className={`w-full bg-academia-bg/50 border rounded-lg px-2.5 py-2 text-xs text-academia-parchment/90 leading-relaxed resize-none placeholder:text-academia-muted/30 focus:outline-none transition-colors ${
          isFocused
            ? 'border-academia-gold/50'
            : 'border-academia-border/50 hover:border-academia-border'
        }`}
        rows={3}
        value={value}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      />
      {value && (
        <p className="text-[9px] text-academia-muted/30 text-right">
          {value.length} 字
        </p>
      )}
    </div>
  );
}