'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Wand2,
  Briefcase,
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
// Types
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BuilderPage() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, updateData, addArrayItem, removeArrayItem, loadFullData } = useResume();

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleAiWriteSummary = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai-write', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      updateData('personalInfo', { summary: result.data });
    } catch {
      console.error('AI Summary Failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.data) {
        loadFullData(result.data);
        setStep(1);
      }
    } catch {
      alert('Parsing failed.');
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAtsOptimize = async (
    text: string,
    section: keyof typeof data,
    id?: string,
    field?: string
  ) => {
    if (!text) return;
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/ats-optimize', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const result = await res.json();

      if (id && field) {
        updateData(section, (prev: any) =>
          prev.map((item: any) =>
            item.id === id ? { ...item, [field]: result.data } : item
          )
        );
      } else {
        updateData(section, { [field || 'summary']: result.data });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderInput = ({
    label,
    value,
    onChange,
    placeholder,
    isTextarea = false,
    section,
    id,
    field,
  }: RenderInputOptions) => (
    <div className="relative w-full space-y-1 group">
      <div className="flex items-center justify-between">
        <label className="ml-1 text-xs sm:text-sm font-medium text-emerald-100/70">
          {label}
        </label>

        {isTextarea && (
          <button
            onClick={() => handleAtsOptimize(value, section!, id, field)}
            className="flex items-center text-[10px] text-emerald-400 opacity-0 transition-opacity hover:text-emerald-300 group-hover:opacity-100 active:opacity-100"
          >
            <Wand2 className="mr-1 h-3 w-3" />
            {isOptimizing ? 'Optimizing…' : 'ATS Polish'}
          </button>
        )}
      </div>

      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[90px] sm:min-h-[100px] w-full rounded-xl border border-emerald-500/20 bg-black/20 p-2.5 sm:p-3 text-sm sm:text-base text-white outline-none ring-emerald-500 focus:ring-2"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-emerald-500/20 bg-black/20 p-2.5 sm:p-3 text-sm sm:text-base text-white outline-none ring-emerald-500 focus:ring-2"
        />
      )}
    </div>
  );

  const stepDots = [1, 2, 3, 4, 5, 6, 7];

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-3 sm:px-6 py-6 sm:py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-emerald-600/10 blur-[120px]" />

      {/* Main card */}
      <div className="glass-card z-10 mb-6 sm:mb-8 w-full rounded-2xl sm:rounded-[3rem] border border-white/5 bg-black/40 p-5 sm:p-8 md:p-12 shadow-2xl">

        {/* --------------------------------------------------------------- */}
        {/* STEP 0 — Getting Started                                         */}
        {/* --------------------------------------------------------------- */}
        {step === 0 && (
          <div className="space-y-6 sm:space-y-8 py-6 sm:py-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Create your pro resume
            </h1>
            <p className="mx-auto max-w-lg text-sm sm:text-base text-emerald-100/60 px-2">
              Upload an existing PDF for AI extraction or build your document manually from scratch.
            </p>

            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:gap-6 pt-4 sm:pt-8 sm:grid-cols-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-32 sm:h-40 flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-white/5 text-base sm:text-lg font-medium transition-all hover:bg-emerald-500/5"
              >
                <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
                {isLoading ? 'Analyzing PDF…' : 'Upload & AI Autofill'}
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />

              <Button
                onClick={() => setStep(1)}
                className="flex h-32 sm:h-40 flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl bg-emerald-600 text-base sm:text-lg font-medium text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500"
              >
                <FileText className="h-8 w-8 sm:h-10 sm:w-10" />
                Start from Scratch
              </Button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* STEPS 1–7                                                        */}
        {/* --------------------------------------------------------------- */}
        {step > 0 && step < 8 && (
          <>
            {/* Progress header */}
            <div className="mb-6 sm:mb-10 flex items-center justify-between gap-3">
              <span className="font-mono text-xs sm:text-sm uppercase tracking-widest text-emerald-400 shrink-0">
                Step 0{step}
              </span>
              {/* Dots — fewer shown on very small screens via truncation */}
              <div className="flex gap-1 sm:gap-2 overflow-hidden">
                {stepDots.map((i) => (
                  <div
                    key={i}
                    className={`h-1 sm:h-1.5 w-5 sm:w-6 md:w-10 rounded-full transition-all shrink-0 ${
                      step >= i
                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="custom-scrollbar max-h-[55vh] sm:max-h-[60vh] min-h-[44vh] sm:min-h-[50vh] overflow-y-auto overflow-x-hidden pr-2 sm:pr-4">

              {/* Step 1 — Personal Info */}
              {step === 1 && (
                <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                    {renderInput({
                      label: 'Full Name',
                      value: data.personalInfo.fullName,
                      onChange: (v) => updateData('personalInfo', { fullName: v }),
                      placeholder: 'Full name',
                    })}
                    {renderInput({
                      label: 'Email',
                      value: data.personalInfo.email,
                      onChange: (v) => updateData('personalInfo', { email: v }),
                      placeholder: 'email@xyz.com',
                    })}
                    {renderInput({
                      label: 'Phone',
                      value: data.personalInfo.phone,
                      onChange: (v) => updateData('personalInfo', { phone: v }),
                      placeholder: '+91 00000 00000',
                    })}
                    {renderInput({
                      label: 'Location',
                      value: data.personalInfo.location,
                      onChange: (v) => updateData('personalInfo', { location: v }),
                      placeholder: 'Location',
                    })}
                    {renderInput({
                      label: 'LinkedIn URL',
                      value: data.personalInfo.linkedin,
                      onChange: (v) => updateData('personalInfo', { linkedin: v }),
                      placeholder: 'linkedin.com/in/user',
                    })}
                    {renderInput({
                      label: 'GitHub / Portfolio',
                      value: data.personalInfo.github,
                      onChange: (v) => updateData('personalInfo', { github: v }),
                      placeholder: 'github.com/user',
                    })}
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <label className="mb-3 ml-1 flex items-center gap-2 font-mono text-xs sm:text-sm tracking-widest text-emerald-400">
                      <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      TARGET JOB PROFILE
                    </label>
                    <SmartTagInput
                      tags={
                        data.personalInfo.website
                          ? data.personalInfo.website.split(',').filter(Boolean)
                          : []
                      }
                      placeholder="e.g. Full Stack Developer, Professor"
                      onChange={(tags: any) =>
                        updateData('personalInfo', { website: tags.join(',') })
                      }
                    />
                    <p className="mt-2 ml-1 text-[10px] italic text-emerald-100/40">
                      *We'll use this to optimize your ATS keywords.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2 — Education */}
              {step === 2 && (
                <div className="space-y-4 sm:space-y-6">
                  <motion.div
                    layout
                    className={`flex w-full overflow-hidden ${
                      data.education.length === 0
                        ? 'flex-col items-center justify-center py-12 sm:py-20 border-2 border-dashed border-emerald-500/20 rounded-2xl sm:rounded-[2rem] bg-black/20'
                        : 'flex-row items-center justify-between mb-4 sm:mb-6'
                    }`}
                  >
                    <motion.h2
                      layout
                      className={`font-bold ${
                        data.education.length === 0
                          ? 'text-xl sm:text-2xl text-emerald-100/60 mb-4 sm:mb-6 text-center'
                          : 'text-2xl sm:text-3xl text-white'
                      }`}
                    >
                      {data.education.length === 0 ? 'Where did you study?' : 'Education'}
                    </motion.h2>

                    <motion.div layout>
                      <Button
                        onClick={() =>
                          addArrayItem('education', {
                            degree: '',
                            institution: '',
                            duration: '',
                            grade: '',
                          })
                        }
                        variant={data.education.length === 0 ? 'default' : 'outline'}
                        className={
                          data.education.length === 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg shadow-xl shadow-emerald-900/40'
                            : 'border-emerald-500/30 text-emerald-400 text-sm sm:text-base'
                        }
                      >
                        <Plus className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        {data.education.length === 0 ? 'Add Your First Degree' : 'Add Degree'}
                      </Button>
                    </motion.div>
                  </motion.div>

                  <AnimatePresence>
                    {data.education.map((edu: any) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden', padding: 0, margin: 0 }}
                        transition={{ duration: 0.25 }}
                        key={edu.id}
                        className="group relative rounded-xl sm:rounded-2xl border border-emerald-500/10 bg-black/20 p-4 sm:p-6 mb-3 sm:mb-4"
                      >
                        <button
                          onClick={() => removeArrayItem('education', edu.id)}
                          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-500 transition-colors hover:text-red-400 active:text-red-400 z-10 p-1"
                          aria-label="Remove education"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 pr-6 sm:pr-0">
                          {renderInput({
                            label: 'Degree',
                            value: edu.degree,
                            onChange: (v) =>
                              updateData('education', (p: any) =>
                                p.map((i: any) => (i.id === edu.id ? { ...i, degree: v } : i))
                              ),
                            placeholder: 'Education',
                          })}
                          {renderInput({
                            label: 'College/University',
                            value: edu.institution,
                            onChange: (v) =>
                              updateData('education', (p: any) =>
                                p.map((i: any) => (i.id === edu.id ? { ...i, institution: v } : i))
                              ),
                            placeholder: 'Institution name',
                          })}
                          {renderInput({
                            label: 'Duration',
                            value: edu.duration,
                            onChange: (v) =>
                              updateData('education', (p: any) =>
                                p.map((i: any) => (i.id === edu.id ? { ...i, duration: v } : i))
                              ),
                            placeholder: 'yyyy-yyyy',
                          })}
                          {renderInput({
                            label: 'Grade/GPA',
                            value: edu.grade,
                            onChange: (v) =>
                              updateData('education', (p: any) =>
                                p.map((i: any) => (i.id === edu.id ? { ...i, grade: v } : i))
                              ),
                            placeholder: 'Average CGPA',
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Step 3 — Skills */}
              {step === 3 && (
                <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-2xl sm:text-3xl font-bold">Skills &amp; Languages</h2>

                  <div className="space-y-2">
                    <label className="ml-1 text-xs sm:text-sm text-emerald-100/70">
                      TECHNICAL SKILLS
                    </label>
                    <SmartTagInput
                      tags={data.skills.technical ? data.skills.technical.split(',').filter(Boolean) : []}
                      placeholder="Enter Skills (Enter/Comma to add)…"
                      onChange={(tags: any) => updateData('skills', { technical: tags.join(',') })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-xs sm:text-sm text-emerald-100/70">
                      TOOLS &amp; FRAMEWORKS
                    </label>
                    <SmartTagInput
                      tags={data.skills.tools ? data.skills.tools.split(',').filter(Boolean) : []}
                      placeholder="e.g. Figma, VS Code, Excel, Adobe"
                      onChange={(tags: any) => updateData('skills', { tools: tags.join(',') })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-xs sm:text-sm text-emerald-100/70">
                      SOFT SKILLS
                    </label>
                    <SmartTagInput
                      tags={data.skills.soft ? data.skills.soft.split(',').filter(Boolean) : []}
                      placeholder="e.g. Leadership, Problem Solving, Agile…"
                      onChange={(tags: any) => updateData('skills', { soft: tags.join(',') })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-xs sm:text-sm text-emerald-100/70">
                      LANGUAGES
                    </label>
                    <SmartTagInput
                      tags={data.skills.languages ? data.skills.languages.split(',').filter(Boolean) : []}
                      placeholder="English, Hindi, Marathi…"
                      onChange={(tags: any) => updateData('skills', { languages: tags.join(',') })}
                    />
                  </div>
                </div>
              )}

              {/* Step 4 — Experience */}
              {step === 4 && (
                <div className="space-y-4 sm:space-y-6">
                  <motion.div
                    layout
                    className={`flex w-full overflow-hidden ${
                      data.experience.length === 0
                        ? 'flex-col items-center justify-center py-12 sm:py-20 border-2 border-dashed border-emerald-500/20 rounded-2xl sm:rounded-[2rem] bg-black/20'
                        : 'flex-row items-center justify-between mb-4 sm:mb-6'
                    }`}
                  >
                    <motion.h2
                      layout
                      className={`font-bold ${
                        data.experience.length === 0
                          ? 'text-xl sm:text-2xl text-emerald-100/60 mb-4 sm:mb-6 text-center'
                          : 'text-2xl sm:text-3xl text-white'
                      }`}
                    >
                      {data.experience.length === 0 ? 'Where have you worked?' : 'Experience'}
                    </motion.h2>

                    <motion.div layout>
                      <Button
                        onClick={() =>
                          addArrayItem('experience', {
                            title: '',
                            company: '',
                            duration: '',
                            responsibilities: '',
                          })
                        }
                        variant={data.experience.length === 0 ? 'default' : 'outline'}
                        className={
                          data.experience.length === 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg shadow-xl shadow-emerald-900/40'
                            : 'border-emerald-500/30 text-emerald-400 text-sm sm:text-base'
                        }
                      >
                        <Plus className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        {data.experience.length === 0 ? 'Add Your First Job' : 'Add Job'}
                      </Button>
                    </motion.div>
                  </motion.div>

                  <AnimatePresence>
                    {data.experience.map((exp: any) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden', padding: 0, margin: 0 }}
                        transition={{ duration: 0.25 }}
                        key={exp.id}
                        className="relative rounded-xl sm:rounded-2xl border border-emerald-500/10 bg-black/20 p-4 sm:p-6 mb-3 sm:mb-4"
                      >
                        <button
                          onClick={() => removeArrayItem('experience', exp.id)}
                          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-500 hover:text-red-400 active:text-red-400 z-10 p-1"
                          aria-label="Remove experience"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="mb-3 sm:mb-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 pr-6 sm:pr-0">
                          {renderInput({
                            label: 'Job Title',
                            value: exp.title,
                            onChange: (v) =>
                              updateData('experience', (p: any) =>
                                p.map((i: any) => (i.id === exp.id ? { ...i, title: v } : i))
                              ),
                            placeholder: 'Web Dev Intern',
                          })}
                          {renderInput({
                            label: 'Company',
                            value: exp.company,
                            onChange: (v) =>
                              updateData('experience', (p: any) =>
                                p.map((i: any) => (i.id === exp.id ? { ...i, company: v } : i))
                              ),
                            placeholder: 'Google, Microsoft, etc.',
                          })}
                          {renderInput({
                            label: 'Duration',
                            value: exp.duration,
                            onChange: (v) =>
                              updateData('experience', (p: any) =>
                                p.map((i: any) => (i.id === exp.id ? { ...i, duration: v } : i))
                              ),
                            placeholder: 'Jan yyyy – Present',
                          })}
                        </div>

                        {renderInput({
                          label: 'Responsibilities',
                          value: exp.responsibilities,
                          onChange: (v) =>
                            updateData('experience', (p: any) =>
                              p.map((i: any) =>
                                i.id === exp.id ? { ...i, responsibilities: v } : i
                              )
                            ),
                          placeholder: 'Describe your achievements…',
                          isTextarea: true,
                          section: 'experience',
                          id: exp.id,
                          field: 'responsibilities',
                        })}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Step 5 — Projects */}
              {step === 5 && (
                <div className="space-y-4 sm:space-y-6">
                  <motion.div
                    layout
                    className={`flex w-full overflow-hidden ${
                      data.projects.length === 0
                        ? 'flex-col items-center justify-center py-12 sm:py-20 border-2 border-dashed border-emerald-500/20 rounded-2xl sm:rounded-[2rem] bg-black/20'
                        : 'flex-row items-center justify-between mb-4 sm:mb-6'
                    }`}
                  >
                    <motion.h2
                      layout
                      className={`font-bold ${
                        data.projects.length === 0
                          ? 'text-xl sm:text-2xl text-emerald-100/60 mb-4 sm:mb-6 text-center'
                          : 'text-2xl sm:text-3xl text-white'
                      }`}
                    >
                      {data.projects.length === 0 ? 'What have you built?' : 'Projects'}
                    </motion.h2>

                    <motion.div layout>
                      <Button
                        onClick={() =>
                          addArrayItem('projects', { name: '', stack: '', description: '' })
                        }
                        variant={data.projects.length === 0 ? 'default' : 'outline'}
                        className={
                          data.projects.length === 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 sm:px-8 py-4 sm:py-6 text-base sm:text-lg shadow-xl shadow-emerald-900/40'
                            : 'border-emerald-500/30 text-emerald-400 text-sm sm:text-base'
                        }
                      >
                        <Plus className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        {data.projects.length === 0 ? 'Add Your First Project' : 'Add Project'}
                      </Button>
                    </motion.div>
                  </motion.div>

                  <AnimatePresence>
                    {data.projects.map((proj: any) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden', padding: 0, margin: 0 }}
                        transition={{ duration: 0.25 }}
                        key={proj.id}
                        className="relative rounded-xl sm:rounded-2xl border border-emerald-500/10 bg-black/20 p-4 sm:p-6 mb-3 sm:mb-4"
                      >
                        <button
                          onClick={() => removeArrayItem('projects', proj.id)}
                          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-500 hover:text-red-400 active:text-red-400 z-10 p-1"
                          aria-label="Remove project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="mb-3 sm:mb-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 pr-6 sm:pr-0">
                          {renderInput({
                            label: 'Project Name',
                            value: proj.name,
                            onChange: (v) =>
                              updateData('projects', (p: any) =>
                                p.map((i: any) => (i.id === proj.id ? { ...i, name: v } : i))
                              ),
                            placeholder: 'E-commerce App',
                          })}
                          {renderInput({
                            label: 'Tech Stack',
                            value: proj.stack,
                            onChange: (v) =>
                              updateData('projects', (p: any) =>
                                p.map((i: any) => (i.id === proj.id ? { ...i, stack: v } : i))
                              ),
                            placeholder: 'Next.js, MongoDB',
                          })}
                        </div>

                        {renderInput({
                          label: 'Description',
                          value: proj.description,
                          onChange: (v) =>
                            updateData('projects', (p: any) =>
                              p.map((i: any) =>
                                i.id === proj.id ? { ...i, description: v } : i
                              )
                            ),
                          placeholder: 'What problems did you solve?',
                          isTextarea: true,
                          section: 'projects',
                          id: proj.id,
                          field: 'description',
                        })}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Step 6 — Extras */}
              {step === 6 && (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-2xl sm:text-3xl font-bold">Extra Details</h2>
                  {renderInput({
                    label: 'Certifications',
                    value: data.extras.certifications,
                    onChange: (v) => updateData('extras', { certifications: v }),
                    placeholder: 'MSC-IT, Excel Expert, NPTEL, etc.',
                    isTextarea: true,
                  })}
                  {renderInput({
                    label: 'Awards',
                    value: data.extras.awards,
                    onChange: (v) => updateData('extras', { awards: v }),
                    placeholder: 'Hackathon Winner, etc.',
                    isTextarea: true,
                  })}
                  {renderInput({
                    label: 'Hobbies',
                    value: data.extras.hobbies,
                    onChange: (v) => updateData('extras', { hobbies: v }),
                    placeholder: '3D Design, Video Gaming…',
                  })}
                </div>
              )}

              {/* Step 7 — Summary */}
              {step === 7 && (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  {/* Stack on mobile, row on sm+ */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold">Final Summary</h2>
                      <p className="mt-1 text-sm sm:text-base text-emerald-100/60">
                        AI will craft a profile based on your education and skills.
                      </p>
                    </div>
                    <Button
                      onClick={handleAiWriteSummary}
                      disabled={isAiLoading}
                      className="gap-2 bg-emerald-600 shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 w-full sm:w-auto"
                    >
                      <Sparkles
                        className={isAiLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
                      />
                      {isAiLoading ? 'Processing…' : 'AI Write for Me'}
                    </Button>
                  </div>

                  {renderInput({
                    label: 'Professional Summary',
                    value: data.personalInfo.summary,
                    onChange: (v) => updateData('personalInfo', { summary: v }),
                    placeholder: 'Dedicated professional with…',
                    isTextarea: true,
                    section: 'personalInfo',
                    field: 'summary',
                  })}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-6 sm:mt-10 flex justify-between border-t border-white/5 pt-4 sm:pt-6">
              {step > 0 ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  className="text-slate-400 transition-colors hover:text-white text-sm sm:text-base px-2 sm:px-4"
                >
                  <ArrowLeft className="mr-1.5 sm:mr-2 h-4 w-4" />
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 8 && (
                <Button
                  className="rounded-xl bg-emerald-600 px-5 sm:px-10 text-sm sm:text-base shadow-lg shadow-emerald-900/20 hover:bg-emerald-500"
                  onClick={() => setStep((s) => s + 1)}
                >
                  {step === 7 ? 'Finalize & Preview' : 'Next Section'}
                  <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* --------------------------------------------------------------- */}
        {/* STEP 8 — PDF Preview                                             */}
        {/* --------------------------------------------------------------- */}
        {step === 8 && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header row: stack on mobile */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold">Final Preview</h2>

              <PDFDownloadLink
                document={<ResumePDF data={data} />}
                fileName="Resume_AICV_Pro.pdf"
              >
                {/* @ts-ignore */}
                {({ loading }) => (
                  <Button className="w-full sm:w-auto bg-emerald-600 shadow-xl shadow-emerald-900/30 hover:bg-emerald-500">
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'Baking PDF…' : 'Download Resume'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>

            {/* PDF viewer — shorter on mobile */}
            <div className="h-[420px] sm:h-[550px] md:h-[650px] overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/20 bg-white shadow-2xl">
              <PDFViewer width="100%" height="100%" showToolbar={false} className="rounded-2xl sm:rounded-3xl">
                <ResumePDF data={data} />
              </PDFViewer>
            </div>

            <Button
              variant="ghost"
              onClick={() => setStep(7)}
              className="text-slate-400 hover:text-white text-sm sm:text-base px-2 sm:px-4"
            >
              <ArrowLeft className="mr-1.5 sm:mr-2 h-4 w-4" />
              Return to Editor
            </Button>
          </div>
        )}
      </div>

    <footer className="pb-6 text-center text-xs sm:text-sm text-emerald-100/40">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-2">
          <span className="font-bold text-emerald-500/60 uppercase tracking-tighter">AIcv Pro</span>
          <span aria-hidden>|</span>
          <span>© {new Date().getFullYear()}</span>
          <span aria-hidden className="hidden sm:inline">|</span>
          <Link href="/how-to-use" className="underline decoration-emerald-500/20 hover:text-emerald-400">How to Use</Link>
          <span aria-hidden>|</span>
          <Link href="/privacy" className="underline decoration-emerald-500/20 hover:text-emerald-400">Privacy</Link>
          <span aria-hidden>|</span>
          <Link href="/terms" className="underline decoration-emerald-500/20 hover:text-emerald-400">Terms</Link>
        </div>
        
        <div className="mt-3 flex flex-col gap-1">
          {/* Email Link */}
          <a 
            href="mailto:rohitbanerjee847@gmail.com" 
            className="text-[10px] sm:text-xs opacity-80 hover:opacity-100 hover:text-emerald-400"
          >
            Developer: <span className="underline decoration-emerald-500/40">rohitbanerjee847@gmail.com</span>
          </a>
          
          {/* GitHub Link */}
          <a 
            href="https://github.com/Rohit-ux-stack" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] sm:text-xs opacity-80 hover:opacity-100 hover:text-emerald-400 transition-all"
          >
            GitHub: <span className="underline decoration-emerald-500/40">github.com/Rohit-ux-stack</span>
          </a>
        </div>
      </footer>
    </div>
  );
}