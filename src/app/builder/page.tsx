'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowLeft, Plus, UploadCloud,
  FileText, Trash2, Download, Wand2, Briefcase, Zap,
  User, GraduationCap, Wrench, BriefcaseBusiness, FolderOpen,
  Award, FileEdit, Mail, AlertCircle, CheckCircle2,
} from 'lucide-react';

import { useResume } from '@/components/builder/ResumeContext';
import { Button } from '@/components/ui/button';
import { SmartTagInput } from '@/components/ui/SmartTagInput';
import { ResumePDF } from '@/components/builder/ResumePDF';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Custom GitHub SVG Component
// ---------------------------------------------------------------------------
const CustomGithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// ---------------------------------------------------------------------------
// Types & Variants
// ---------------------------------------------------------------------------
interface RenderInputOptions {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  isTextarea?: boolean;
  section?: keyof ReturnType<typeof useResume>['data'];
  id?: string;
  field?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, type: 'tween' as const, ease: 'easeOut' as const } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.28, type: 'tween' as const, ease: 'easeIn' as const } },
};

const fadeUpVariants = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, type: 'tween' as const, ease: 'easeOut' as const } },
};

const cardVariants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.2  } },
};

const STEP_META = [
  { label: 'Profile',     Icon: User             },
  { label: 'Education',   Icon: GraduationCap    },
  { label: 'Skills',      Icon: Wrench           },
  { label: 'Experience',  Icon: BriefcaseBusiness},
  { label: 'Projects',    Icon: FolderOpen       },
  { label: 'Extras',      Icon: Award            },
  { label: 'Summary',     Icon: FileEdit         },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BuilderPage() {
  const [step, setStep] = useState(0);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isAiLoading,  setIsAiLoading]  = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isFullOptimizing, setIsFullOptimizing] = useState(false);
  const [optimizeSuccess, setOptimizeSuccess] = useState(false); // NEW SUCCESS STATE
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, updateData, addArrayItem, removeArrayItem, loadFullData } = useResume();

  // ── Validation Logic ──────────────────────────────────────────────────────
  const checkValidation = () => {
    if (step === 1) {
      if (!data.personalInfo.fullName?.trim() || !data.personalInfo.phone?.trim()) {
        return { isValid: false, message: 'Full Name and Phone Number are required.' };
      }
    }
    if (step === 2) {
      if (data.education.length === 0 || !data.education[0]?.degree?.trim()) {
        return { isValid: false, message: 'At least one Education degree is required.' };
      }
    }
    if (step === 3) {
      if (!data.skills.soft?.trim() || !data.skills.languages?.trim()) {
        return { isValid: false, message: 'Please add at least one Soft Skill and Language.' };
      }
    }
    return { isValid: true, message: '' };
  };

  const validationState = checkValidation();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFullOptimize = async () => {
    setIsFullOptimizing(true);
    setOptimizeSuccess(false);
    try {
      const res = await fetch('/api/full-optimize', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.data) {
        loadFullData(result.data);
        setOptimizeSuccess(true); // TRIGGER SUCCESS
        setTimeout(() => setOptimizeSuccess(false), 5000); // RESET AFTER 5 SECONDS
      }
    } catch (error) {
      console.error(error);
      alert("Optimization failed. Please try again.");
    } finally {
      setIsFullOptimizing(false);
    }
  };

  const handleAiWriteSummary = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai-write', { method: 'POST', body: JSON.stringify(data) });
      const result = await res.json();
      updateData('personalInfo', { summary: result.data });
    } catch { console.error('AI Summary Failed'); }
    finally { setIsAiLoading(false); }
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF document.");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/parse', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.data) { loadFullData(result.data); setStep(1); }
    } catch { alert('Parsing failed.'); setStep(1); }
    finally { setIsLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAtsOptimize = async (
    text: string, section: keyof typeof data, id?: string, field?: string
  ) => {
    if (!text) return;
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/ats-optimize', { method: 'POST', body: JSON.stringify({ text }) });
      const result = await res.json();
      if (id && field) {
        updateData(section, (prev: any) =>
          prev.map((item: any) => item.id === id ? { ...item, [field]: result.data } : item)
        );
      } else {
        updateData(section, { [field || 'summary']: result.data });
      }
    } catch (e) { console.error(e); }
    finally { setIsOptimizing(false); }
  };

  // ── Shared input renderer ──────────────────────────────────────────────────
  const renderInput = ({
    label, value, onChange, placeholder,
    isTextarea = false, section, id, field,
  }: RenderInputOptions) => (
    <div className="relative w-full space-y-1.5 group">
      <div className="flex items-center justify-between">
        <label className="ml-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
          {label} {['Full Name', 'Phone Number', 'Degree / Qualification', 'Soft Skills', 'Languages'].includes(label) && <span className="text-red-400">*</span>}
        </label>
        {isTextarea && (
          <button
            onClick={() => handleAtsOptimize(value, section!, id, field)}
            className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-amber-500/20"
          >
            <Wand2 className="h-2.5 w-2.5" />
            {isOptimizing ? 'Optimizing…' : 'ATS Polish'}
          </button>
        )}
      </div>

      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[108px] w-full resize-none rounded-xl border border-violet-400/25 bg-white/[0.06] p-3.5 text-[15px] leading-relaxed text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-violet-400/70 focus:bg-white/[0.10] focus:ring-2 focus:ring-violet-500/20"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-violet-400/25 bg-white/[0.06] p-3.5 text-[15px] text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-violet-400/70 focus:bg-white/[0.10] focus:ring-2 focus:ring-violet-500/20"
        />
      )}
    </div>
  );

  const sectionHeader = (title: string, subtitle: string, onAdd: () => void, btnLabel: string) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-violet-500/15 pb-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-violet-300/70">{subtitle}</p>
      </div>
      <Button onClick={onAdd} className="w-full sm:w-auto border border-violet-500/40 bg-violet-500/10 text-violet-200 font-semibold hover:bg-violet-500/25 hover:text-white hover:border-violet-400/60 transition-all rounded-xl">
        <Plus className="mr-2 h-4 w-4" /> {btnLabel}
      </Button>
    </div>
  );

  const deleteBtn = (onClick: () => void) => (
    <button onClick={onClick} className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-400 transition-all hover:bg-red-500 hover:text-white hover:border-red-500">
      <Trash2 className="h-3 w-3" /> Remove
    </button>
  );

  const cardCls = 'relative rounded-2xl border border-violet-500/15 bg-white/[0.04] p-5 sm:p-6 mb-4 shadow-lg shadow-black/20';

  const emptyState = (message: string, onAdd: () => void, btnLabel: string) => (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-violet-500/20 bg-white/[0.02] py-16 sm:py-20 text-center">
      <p className="text-base font-medium text-violet-300/60">{message}</p>
      <Button onClick={onAdd} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-8 py-5 rounded-xl hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-violet-900/30">
        <Plus className="mr-2 h-4 w-4" /> {btnLabel}
      </Button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center px-4 py-6 sm:px-6 sm:py-10 overflow-hidden" style={{ background: 'radial-gradient(ellipse at 20% 0%, #1a0733 0%, #080812 55%, #000000 100%)' }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2.5, type: 'tween' as const, ease: 'easeOut' as const }} className="absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-violet-700/20 blur-[140px]" />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2.5, delay: 0.6, type: 'tween' as const, ease: 'easeOut' as const }} className="absolute bottom-0 -right-48 h-[500px] w-[500px] rounded-full bg-indigo-700/15 blur-[130px]" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 3, delay: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-violet-900/10 blur-[100px]" />
      </div>

      <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" className="relative z-10 mb-7 text-center shrink-0">
        <div className="inline-flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/60 ring-1 ring-white/15">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-lg">AICV<span className="text-violet-400">-Pro</span></h1>
        </div>
        <p className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-violet-300/60">Build Smarter · Get Hired Faster</p>
      </motion.div>

      <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" className="relative z-10 mb-8 w-full max-w-5xl rounded-[2rem] sm:rounded-[2.5rem] border border-violet-500/15 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 sm:p-8 md:p-12 shadow-2xl shadow-violet-950/60 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[2.5rem] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step-0" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-8 py-6 sm:py-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-200">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" /> AI-Powered · ATS-Optimised · Free
              </div>
              <div className="space-y-3">
                <h2 className="text-[clamp(2rem,6vw,3.5rem)] font-black tracking-tight text-white leading-[1.1]">Your resume,<br /><span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-violet-400 bg-clip-text text-transparent">reinvented by AI</span></h2>
                <p className="mx-auto max-w-lg text-base sm:text-lg text-violet-200/70 leading-relaxed font-medium">Upload a PDF for instant AI extraction, or craft a polished, ATS-ready document from scratch in minutes.</p>
              </div>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5 pt-4 sm:grid-cols-2">
                
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()} 
                  className={`group flex h-40 sm:h-44 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed font-medium transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                    isDragging 
                      ? 'border-violet-400 bg-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]' 
                      : 'border-violet-500/25 bg-white/[0.04] hover:border-violet-400/50 hover:bg-violet-500/10 hover:shadow-lg hover:shadow-violet-900/20'
                  }`}
                >
                  <div className={`flex h-13 w-13 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${isDragging && 'scale-110 rotate-3'}`}>
                    <UploadCloud className="h-6 w-6 text-violet-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-white">{isLoading ? 'Analyzing…' : (isDragging ? 'Drop PDF Here' : 'Upload & AI Autofill')}</p>
                    <p className="mt-0.5 text-xs text-violet-300/55 font-normal">Click or drag & drop existing PDF</p>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                
                <button onClick={() => setStep(1)} className="group flex h-40 sm:h-44 flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 font-medium text-white transition-all duration-300 hover:from-violet-500 hover:to-indigo-600 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-900/40 active:scale-[0.98]">
                  <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-white/15 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold">Start from Scratch</p>
                    <p className="mt-0.5 text-xs text-violet-200/65 font-normal">Build step-by-step with precision</p>
                  </div>
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {['ATS Keyword Optimiser', 'AI Summary Writer', 'Instant PDF Export', 'No account needed'].map((f) => (
                  <span key={f} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-violet-300/60">{f}</span>
                ))}
              </div>
            </motion.div>
          )}

          {step > 0 && step < 8 && (
            <motion.div key={`step-${step}`} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="mb-7 sm:mb-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => { const { Icon } = STEP_META[step - 1]; return <Icon className="h-4 w-4 text-violet-400" />; })()}
                    <span className="text-sm sm:text-base font-bold text-white">{STEP_META[step - 1].label}</span>
                    <span className="ml-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300">{step} / 7</span>
                  </div>
                  <span className="text-xs font-medium text-violet-400/70">{Math.round((step / 7) * 100)}% complete</span>
                </div>
                <div className="flex gap-1 sm:gap-1.5">
                  {STEP_META.map((_, i) => {
                    const idx = i + 1;
                    return (
                      <button key={idx} onClick={() => idx < step && setStep(idx)} title={STEP_META[i].label} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step > idx ? 'bg-violet-400/80 cursor-pointer hover:bg-violet-300' : step === idx ? 'bg-gradient-to-r from-violet-400 to-indigo-400 shadow-[0_0_10px_rgba(139,92,246,0.7)]' : 'bg-white/10'}`} />
                    );
                  })}
                </div>
              </div>

              <div className="max-h-[58vh] min-h-[46vh] overflow-y-auto overflow-x-hidden pr-1 sm:pr-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {renderInput({ label: 'Full Name', value: data.personalInfo.fullName, onChange: (v) => updateData('personalInfo', { fullName: v }), placeholder: 'Jane Doe' })}
                      {renderInput({ label: 'Email Address', value: data.personalInfo.email, onChange: (v) => updateData('personalInfo', { email: v }), placeholder: 'jane@email.com' })}
                      {renderInput({ label: 'Phone Number', value: data.personalInfo.phone, onChange: (v) => updateData('personalInfo', { phone: v }), placeholder: '+91 00000 00000' })}
                      {renderInput({ label: 'Location', value: data.personalInfo.location, onChange: (v) => updateData('personalInfo', { location: v }), placeholder: 'Mumbai, India' })}
                      {renderInput({ label: 'LinkedIn Profile', value: data.personalInfo.linkedin, onChange: (v) => updateData('personalInfo', { linkedin: v }), placeholder: 'linkedin.com/in/username' })}
                      {renderInput({ label: 'GitHub / Portfolio', value: data.personalInfo.github, onChange: (v) => updateData('personalInfo', { github: v }), placeholder: 'github.com/username' })}
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 sm:p-5">
                      <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
                        <Briefcase className="h-3.5 w-3.5" /> Target Job Profile
                      </label>
                      <SmartTagInput tags={data.personalInfo.website ? data.personalInfo.website.split(',').filter(Boolean) : []} placeholder="e.g. Full Stack Developer, UI Designer…" onChange={(tags) => updateData('personalInfo', { website: tags.join(',') })} />
                      <p className="mt-2.5 text-[11px] font-medium text-amber-300/50">✦ Used to tailor ATS keywords to your target roles. Be specific.</p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    {data.education.length === 0 ? emptyState('Where did you study?', () => addArrayItem('education', { degree: '', institution: '', duration: '', grade: '' }), 'Add Your First Degree') : <>
                      {sectionHeader('Education', 'Add your academic qualifications.', () => addArrayItem('education', { degree: '', institution: '', duration: '', grade: '' }), 'Add Degree')}
                      <AnimatePresence>
                        {data.education.map((edu: any) => (
                          <motion.div key={edu.id} variants={cardVariants} initial="initial" animate="animate" exit="exit" className={cardCls}>
                            {deleteBtn(() => removeArrayItem('education', edu.id))}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-8 sm:pt-0">
                              {renderInput({ label: 'Degree / Qualification', value: edu.degree, onChange: (v) => updateData('education', (p: any) => p.map((i: any) => i.id === edu.id ? { ...i, degree: v } : i)), placeholder: 'B.Tech Computer Science' })}
                              {renderInput({ label: 'College / University', value: edu.institution, onChange: (v) => updateData('education', (p: any) => p.map((i: any) => i.id === edu.id ? { ...i, institution: v } : i)), placeholder: 'Institution name' })}
                              {renderInput({ label: 'Duration', value: edu.duration, onChange: (v) => updateData('education', (p: any) => p.map((i: any) => i.id === edu.id ? { ...i, duration: v } : i)), placeholder: 'Aug 2020 – May 2024' })}
                              {renderInput({ label: 'Grade / GPA', value: edu.grade, onChange: (v) => updateData('education', (p: any) => p.map((i: any) => i.id === edu.id ? { ...i, grade: v } : i)), placeholder: '9.0 CGPA / 85%' })}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </>}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-violet-500/15 pb-4">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Skills &amp; Languages</h2>
                      <p className="mt-1 text-sm font-medium text-violet-300/70">Press Enter or comma to add each tag.</p>
                    </div>
                    {([{ key: 'technical', label: 'Technical Skills', placeholder: 'JavaScript, Python, React, SQL…' }, { key: 'tools', label: 'Tools & Frameworks', placeholder: 'Figma, Docker, VS Code, Next.js…' }, { key: 'soft', label: 'Soft Skills', placeholder: 'Leadership, Agile, Communication…' }, { key: 'languages', label: 'Languages', placeholder: 'English, Hindi, Marathi…' }] as { key: keyof typeof data.skills; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-2">
                        <label className="ml-1 text-xs font-bold uppercase tracking-widest text-violet-200">{label} {['soft', 'languages'].includes(key) && <span className="text-red-400">*</span>}</label>
                        <SmartTagInput tags={(data.skills as Record<string, string>)[key] ? (data.skills as Record<string, string>)[key].split(',').filter(Boolean) : []} placeholder={placeholder} onChange={(tags) => updateData('skills', { [key]: tags.join(',') })} />
                      </div>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    {data.experience.length === 0 ? emptyState('Where have you worked?', () => addArrayItem('experience', { title: '', company: '', duration: '', responsibilities: '' }), 'Add Your First Job') : <>
                      {sectionHeader('Experience', 'Your work history and internships.', () => addArrayItem('experience', { title: '', company: '', duration: '', responsibilities: '' }), 'Add Job')}
                      <AnimatePresence>
                        {data.experience.map((exp: any) => (
                          <motion.div key={exp.id} variants={cardVariants} initial="initial" animate="animate" exit="exit" className={cardCls}>
                            {deleteBtn(() => removeArrayItem('experience', exp.id))}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-8 sm:pt-0 mb-4">
                              {renderInput({ label: 'Job Title', value: exp.title, onChange: (v) => updateData('experience', (p: any) => p.map((i: any) => i.id === exp.id ? { ...i, title: v } : i)), placeholder: 'Frontend Engineer' })}
                              {renderInput({ label: 'Company', value: exp.company, onChange: (v) => updateData('experience', (p: any) => p.map((i: any) => i.id === exp.id ? { ...i, company: v } : i)), placeholder: 'Company name' })}
                              {renderInput({ label: 'Duration', value: exp.duration, onChange: (v) => updateData('experience', (p: any) => p.map((i: any) => i.id === exp.id ? { ...i, duration: v } : i)), placeholder: 'Jan 2023 – Present' })}
                            </div>
                            {renderInput({ label: 'Responsibilities & Achievements', value: exp.responsibilities, onChange: (v) => updateData('experience', (p: any) => p.map((i: any) => i.id === exp.id ? { ...i, responsibilities: v } : i)), placeholder: 'Describe key achievements and measurable impact…', isTextarea: true, section: 'experience', id: exp.id, field: 'responsibilities' })}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </>}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-5">
                    {data.projects.length === 0 ? emptyState('What have you built?', () => addArrayItem('projects', { name: '', stack: '', description: '' }), 'Add Your First Project') : <>
                      {sectionHeader('Projects', 'Highlight your best work.', () => addArrayItem('projects', { name: '', stack: '', description: '' }), 'Add Project')}
                      <AnimatePresence>
                        {data.projects.map((proj: any) => (
                          <motion.div key={proj.id} variants={cardVariants} initial="initial" animate="animate" exit="exit" className={cardCls}>
                            {deleteBtn(() => removeArrayItem('projects', proj.id))}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-8 sm:pt-0 mb-4">
                              {renderInput({ label: 'Project Name', value: proj.name, onChange: (v) => updateData('projects', (p: any) => p.map((i: any) => i.id === proj.id ? { ...i, name: v } : i)), placeholder: 'E-commerce Platform' })}
                              {renderInput({ label: 'Tech Stack', value: proj.stack, onChange: (v) => updateData('projects', (p: any) => p.map((i: any) => i.id === proj.id ? { ...i, stack: v } : i)), placeholder: 'Next.js, MongoDB, Tailwind' })}
                            </div>
                            {renderInput({ label: 'Description & Impact', value: proj.description, onChange: (v) => updateData('projects', (p: any) => p.map((i: any) => i.id === proj.id ? { ...i, description: v } : i)), placeholder: 'What problem did you solve? What was the outcome?', isTextarea: true, section: 'projects', id: proj.id, field: 'description' })}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </>}
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6">
                    <div className="border-b border-violet-500/15 pb-4">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Extra Details</h2>
                      <p className="mt-1 text-sm font-medium text-violet-300/70">Stand out with certs, awards &amp; interests.</p>
                    </div>
                    {renderInput({ label: 'Certifications', value: data.extras.certifications, onChange: (v) => updateData('extras', { certifications: v }), placeholder: 'AWS Solutions Architect, Google Analytics, NPTEL…', isTextarea: true })}
                    {renderInput({ label: 'Awards & Honours', value: data.extras.awards, onChange: (v) => updateData('extras', { awards: v }), placeholder: 'Hackathon Winner, Dean\'s List…', isTextarea: true })}
                    {renderInput({ label: 'Hobbies & Interests', value: data.extras.hobbies, onChange: (v) => updateData('extras', { hobbies: v }), placeholder: '3D Design, Open Source, Photography…' })}
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-violet-500/15 pb-5">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Professional Summary</h2>
                        <p className="mt-1 text-sm font-medium text-violet-300/70">Your elevator pitch. Let AI craft it from your data.</p>
                      </div>
                      <Button onClick={handleAiWriteSummary} disabled={isAiLoading} className="w-full sm:w-auto shrink-0 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-900/30 hover:from-amber-400 hover:to-orange-400 hover:scale-[1.02] active:scale-95 transition-all rounded-xl px-5">
                        <Sparkles className={isAiLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        {isAiLoading ? 'Writing…' : 'AI Write for Me'}
                      </Button>
                    </div>
                    {renderInput({ label: 'Your Summary', value: data.personalInfo.summary, onChange: (v) => updateData('personalInfo', { summary: v }), placeholder: 'A results-driven professional with X years of experience in…', isTextarea: true, section: 'personalInfo', field: 'summary' })}
                    {data.personalInfo.summary && (
                      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-400/60">Live Preview</p>
                        <p className="text-sm leading-relaxed text-violet-100/80">{data.personalInfo.summary}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Navigation with Validation ── */}
              <div className="mt-7 border-t border-violet-500/15 pt-5">
                {!validationState.isValid && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{validationState.message}</p>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-violet-300 hover:bg-white/8 hover:text-white transition-all">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (validationState.isValid) {
                        setStep((s) => s + 1);
                      }
                    }}
                    disabled={!validationState.isValid}
                    className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 sm:px-12 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {step === 7 ? 'Preview PDF' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 8 — Final PDF Preview & Global ATS Polish                */}
          {/* ============================================================ */}
          {step === 8 && (
            <motion.div key="step-8" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-violet-500/15 pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Your Resume is Ready</h2>
                  <p className="mt-1 text-sm font-medium text-violet-300/70">Download now, or let AI polish everything.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* FULL VISIBLE ATS OPTIMIZE BUTTON ON BOTH DESKTOP AND MOBILE */}
                  <Button 
                    onClick={handleFullOptimize} 
                    disabled={isFullOptimizing || optimizeSuccess}
                    className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl font-bold text-white shadow-xl transition-all duration-500 ${
                      optimizeSuccess 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 cursor-default shadow-emerald-900/40' 
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-[1.02] active:scale-95 shadow-amber-900/30'
                    }`}
                  >
                    {optimizeSuccess ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <Wand2 className={isFullOptimizing ? "h-4 w-4 animate-spin shrink-0" : "h-4 w-4 shrink-0"} />
                    )}
                    
                    {isFullOptimizing ? (
                      <span>Optimising...</span>
                    ) : optimizeSuccess ? (
                      <span className="animate-in fade-in zoom-in duration-300 text-[11px] sm:text-sm text-center leading-tight">
                        <span className="hidden sm:inline">Optimised successfully ready to download!</span>
                        <span className="sm:hidden">Optimised successfully!<br/>Ready to download!</span>
                      </span>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Auto-Optimise for ATS</span>
                        <span className="sm:hidden">Automatically ATS Optimise</span>
                      </>
                    )}
                  </Button>

                  <PDFDownloadLink document={<ResumePDF data={data} />} fileName="AICV_Pro_Resume.pdf" className="w-full sm:w-auto flex">
                    {/* @ts-ignore */}
                    {({ loading }) => (
                      <Button className="flex-1 sm:flex-none justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-xl shadow-emerald-900/40 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition-all active:scale-95 hover:scale-[1.02]">
                        <Download className="h-4 w-4 shrink-0" />
                        {loading ? 'Preparing…' : 'Download PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>

              {/* MOBILE FALLBACK UI FOR PDF VIEWER */}
              <div className="flex sm:hidden flex-col items-center justify-center min-h-[300px] rounded-2xl border-2 border-dashed border-violet-500/30 bg-violet-500/5 p-6 text-center">
                <FileText className="h-12 w-12 text-violet-400/60 mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Preview Not Supported</h3>
                <p className="text-sm text-violet-200/60 mb-6 px-4">
                  Mobile browsers block direct PDF rendering. Tap the button above to safely download and view your resume!
                </p>
              </div>

              {/* DESKTOP LIVE PREVIEW */}
              <div className="hidden sm:block h-[480px] sm:h-[640px] overflow-hidden rounded-2xl border-2 border-violet-500/20 bg-white shadow-[0_0_50px_rgba(139,92,246,0.18)]">
                <PDFViewer width="100%" height="100%" showToolbar={false}>
                  <ResumePDF data={data} />
                </PDFViewer>
              </div>

              <Button variant="ghost" onClick={() => setStep(7)} className="gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-violet-300 hover:bg-white/8 hover:text-white transition-all">
                <ArrowLeft className="h-4 w-4" /> Back to Editor
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="relative z-10 w-full mt-auto shrink-0 border-t border-violet-500/10 pt-6 pb-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs font-medium text-violet-400/60 mb-4">
          <span className="font-black text-violet-400/80 tracking-widest uppercase text-[11px]">AICV-Pro</span>
          <span className="text-violet-500/30">·</span>
          <span className="text-violet-400/40">© {new Date().getFullYear()}</span>
          {[['How to Use', '/how-to-use'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
            <React.Fragment key={href}>
              <span className="hidden sm:inline text-violet-500/30">·</span>
              <Link href={href} className="text-violet-400/60 hover:text-violet-300 transition-colors">{label}</Link>
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <a href="mailto:rohitbanerjee847@gmail.com" className="flex items-center gap-2 text-[11px] font-medium text-violet-400/45 hover:text-violet-300 transition-colors group">
            <Mail className="h-3.5 w-3.5" />
            <span className="group-hover:underline underline-offset-2">rohitbanerjee847@gmail.com</span>
          </a>
          <span className="hidden sm:inline text-violet-600/40">·</span>
          <a href="https://github.com/Rohit-ux-stack" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] font-medium text-violet-400/45 hover:text-violet-300 transition-colors group">
            <CustomGithubIcon className="h-3.5 w-3.5" />
            <span className="group-hover:underline underline-offset-2">github.com/Rohit-ux-stack</span>
          </a>
        </div>
      </motion.footer>
    </div>
  );
}