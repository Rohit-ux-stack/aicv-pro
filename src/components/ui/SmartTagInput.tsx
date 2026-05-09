'use client';
import React, { useState, KeyboardEvent, ClipboardEvent } from 'react';
import { X, Briefcase } from 'lucide-react';

interface SmartTagInputProps {
  tags: string[];
  placeholder: string;
  onChange: (tags: string[]) => void;
}

export function SmartTagInput({ tags, placeholder, onChange }: SmartTagInputProps) {
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const newTags = pastedData
      .split(/[,|\n]/)
      .map(t => t.trim())
      .filter(t => t !== '' && !tags.includes(t));

    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-emerald-500/20 rounded-xl focus-within:ring-2 ring-emerald-500 min-h-[52px] transition-all duration-200">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg text-sm font-medium animate-in fade-in zoom-in duration-200"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter(t => t !== tag))}
            className="hover:text-white hover:bg-emerald-500/20 rounded-full p-0.5 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => { if (input) addTag(input); }}
        placeholder={tags.length === 0 ? placeholder : 'Add more...'}
        className="flex-1 bg-transparent outline-none text-white text-sm min-w-[150px] placeholder:text-emerald-100/20"
      />
    </div>
  );
}

interface TargetJobProfileProps {
  data: {
    personalInfo: {
      website: string;
    };
  };
  updateData: (section: string, value: object) => void;
}

export function TargetJobProfile({ data, updateData }: TargetJobProfileProps) {
  return (
    <div className="border-t border-white/5 pt-4">
      <label className="mb-3 ml-1 flex items-center gap-2 font-mono text-sm tracking-widest text-emerald-400">
        <Briefcase className="h-4 w-4" />
        TARGET JOB PROFILE
      </label>
      <SmartTagInput
        tags={
          data.personalInfo.website
            ? data.personalInfo.website.split(',').map(s => s.trim()).filter(Boolean)
            : []
        }
        placeholder="e.g. Full Stack Developer, Java Developer…"
        onChange={(tags) =>
          updateData('personalInfo', { website: tags.map(t => t.trim()).join(',') })
        }
      />
      <p className="mt-2 ml-1 text-[10px] italic text-emerald-100/40">
        *We'll use this to optimize your ATS keywords.
      </p>
    </div>
  );
}