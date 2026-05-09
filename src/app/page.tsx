'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
        <label className="ml-1 text-sm font-medium text-emerald-100/70">{label}</label>

        {isTextarea && (
          <button
            onClick={() => handleAtsOptimize(value, section!, id, field)}
            className="flex items-center text-[10px] text-emerald-400 opacity-0 transition-opacity hover:text-emerald-300 group-hover:opacity-100"
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
          className="min-h-[100px] w-full rounded-xl border border-emerald-500/20 bg-black/20 p-3 text-white outline-none ring-emerald-500 focus:ring-2 placeholder:text-slate-500"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-emerald-500/20 bg-black/20 p-3 text-white outline-none ring-emerald-500 focus:ring-2 placeholder:text-slate-500"
        />
      )}
    </div>
  );

  const stepDots = [1, 2, 3, 4, 5, 6, 7];

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[120px]" />

      {/* Main card */}
      <div className="glass-card z-10 mb-8 w-full rounded-[3rem] border border-white/5 bg-black/40 p-8 shadow-2xl md:p-12">

        {/* ----------------------------------------------------------------- */}
        {/* STEP 0 — Getting Started                                          */}
        {/* ----------------------------------------------------------------- */}
        {step === 0 && (
          <div className="space-y-8 py-10 text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white">
              Create your pro resume
            </h1>
            <p className="mx-auto max-w-lg text-emerald-100/60">
              Upload an existing PDF for AI extraction or build your document manually from scratch.
            </p>

            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 pt-8 md:grid-cols-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-40 flex-col items-center justify-center gap-3 rounded-3xl border border-emerald-500/30 bg-white/5 text-lg font-medium transition-all hover:bg-emerald-500/5"
              >
                <UploadCloud className="h-10 w-10 text-emerald-400" />
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
                className="flex h-40 flex-col items-center justify-center gap-3 rounded-3xl bg-emerald-600 text-lg font-medium text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500"
              >
                <FileText className="h-10 w-10" />
                Start from Scratch
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEPS 1–7                                                         */}
        {/* ----------------------------------------------------------------- */}
        {step > 0 && step < 8 && (
          <>
            {/* Progress header */}
            <div className="mb-10 flex items-center justify-between">
              <span className="font-mono text-sm uppercase tracking-widest text-emerald-400">
                Section 0{step}
              </span>
              <div className="flex gap-2">
                {stepDots.map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-all md:w-10 ${
                      step >= i
                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="custom-scrollbar max-h-[60vh] min-h-[50vh] overflow-y-auto pr-4">

              {/* Step 1 — Personal Info */}
              {step === 1 && (
                <div className="animate-in fade-in space-y-8 duration-500">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {renderInput({
                      label: 'Full Name',
                      value: data.personalInfo.fullName,
                      onChange: (v) => updateData('personalInfo', { fullName: v }),
                      placeholder: 'First Last',
                    })}
                    {renderInput({
                      label: 'Email',
                      value: data.personalInfo.email,
                      onChange: (v) => updateData('personalInfo', { email: v }),
                      placeholder: 'email@domain.com',
                    })}
                    {renderInput({
                      label: 'Phone',
                      value: data.personalInfo.phone,
                      onChange: (v) => updateData('personalInfo', { phone: v }),
                      placeholder: '+1 (123) 456-7890',
                    })}
                    {renderInput({
                      label: 'Location',
                      value: data.personalInfo.location,
                      onChange: (v) => updateData('personalInfo', { location: v }),
                      placeholder: 'City, State / Country',
                    })}
                    {renderInput({
                      label: 'LinkedIn URL',
                      value: data.personalInfo.linkedin,
                      onChange: (v) => updateData('personalInfo', { linkedin: v }),
                      placeholder: 'linkedin.com/in/username',
                    })}
                    {renderInput({
                      label: 'GitHub / Portfolio',
                      value: data.personalInfo.github,
                      onChange: (v) => updateData('personalInfo', { github: v }),
                      placeholder: 'github.com/username',
                    })}
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <label className="mb-3 ml-1 flex items-center gap-2 font-mono text-sm tracking-widest text-emerald-400">
                      <Briefcase className="h-4 w-4" />
                      TARGET JOB PROFILE (Extracted by AI)
                    </label>
                    <SmartTagInput
                      tags={
                        data.personalInfo.website
                          ? data.personalInfo.website.split(',').filter(Boolean)
                          : []
                      }
                      placeholder="e.g. Job Role 1, Job Role 2..."
                      onChange={(tags) =>
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">Education</h2>
                    <Button
                      onClick={() =>
                        addArrayItem('education', {
                          degree: '',
                          institution: '',
                          duration: '',
                          grade: '',
                        })
                      }
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Degree
                    </Button>
                  </div>

                  {data.education.map((edu: any) => (
                    <div
                      key={edu.id}
                      className="group relative rounded-2xl border border-emerald-500/10 bg-black/20 p-6"
                    >
                      <button
                        onClick={() => removeArrayItem('education', edu.id)}
                        className="absolute top-4 right-4 text-slate-500 transition-colors hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderInput({
                          label: 'Degree',
                          value: edu.degree,
                          onChange: (v) =>
                            updateData('education', (p: any) =>
                              p.map((i: any) =>
                                i.id === edu.id ? { ...i, degree: v } : i
                              )
                            ),
                          placeholder: 'Degree Name',
                        })}
                        {renderInput({
                          label: 'College/University',
                          value: edu.institution,
                          onChange: (v) =>
                            updateData('education', (p: any) =>
                              p.map((i: any) =>
                                i.id === edu.id ? { ...i, institution: v } : i
                              )
                            ),
                          placeholder: 'Institution Name',
                        })}
                        {renderInput({
                          label: 'Duration',
                          value: edu.duration,
                          onChange: (v) =>
                            updateData('education', (p: any) =>
                              p.map((i: any) =>
                                i.id === edu.id ? { ...i, duration: v } : i
                              )
                            ),
                          placeholder: 'Start Year – End Year',
                        })}
                        {renderInput({
                          label: 'Grade/GPA',
                          value: edu.grade,
                          onChange: (v) =>
                            updateData('education', (p: any) =>
                              p.map((i: any) =>
                                i.id === edu.id ? { ...i, grade: v } : i
                              )
                            ),
                          placeholder: 'Score / Grade',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3 — Skills */}
              {step === 3 && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold">Skills &amp; Languages</h2>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm text-emerald-100/70">TECHNICAL SKILLS</label>
                    <SmartTagInput
                      tags={data.skills.technical ? data.skills.technical.split(',').filter(Boolean) : []}
                      placeholder="e.g. Skill 1, Skill 2, Skill 3..."
                      onChange={(tags) => updateData('skills', { technical: tags.join(',') })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm text-emerald-100/70">TOOLS &amp; FRAMEWORKS</label>
                    <SmartTagInput
                      tags={data.skills.tools ? data.skills.tools.split(',').filter(Boolean) : []}
                      placeholder="e.g. Tool 1, Tool 2, Platform 1..."
                      onChange={(tags) => updateData('skills', { tools: tags.join(',') })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm text-emerald-100/70">SOFT SKILLS</label>
                    <SmartTagInput
                      tags={data.skills.soft ? data.skills.soft.split(',').filter(Boolean) : []}
                      placeholder="e.g. Soft Skill 1, Soft Skill 2..."
                      onChange={(tags) => updateData('skills', { soft: tags.join(',') })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm text-emerald-100/70">LANGUAGES</label>
                    <SmartTagInput
                      tags={data.skills.languages ? data.skills.languages.split(',').filter(Boolean) : []}
                      placeholder="e.g. Language 1, Language 2..."
                      onChange={(tags) => updateData('skills', { languages: tags.join(',') })}
                    />
                  </div>
                </div>
              )}

              {/* Step 4 — Experience */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">Experience</h2>
                    <Button
                      onClick={() =>
                        addArrayItem('experience', {
                          title: '',
                          company: '',
                          duration: '',
                          responsibilities: '',
                        })
                      }
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Job
                    </Button>
                  </div>

                  {data.experience.map((exp: any) => (
                    <div
                      key={exp.id}
                      className="relative rounded-2xl border border-emerald-500/10 bg-black/20 p-6"
                    >
                      <button
                        onClick={() => removeArrayItem('experience', exp.id)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderInput({
                          label: 'Job Title',
                          value: exp.title,
                          onChange: (v) =>
                            updateData('experience', (p: any) =>
                              p.map((i: any) =>
                                i.id === exp.id ? { ...i, title: v } : i
                              )
                            ),
                          placeholder: 'Job Role / Title',
                        })}
                        {renderInput({
                          label: 'Company',
                          value: exp.company,
                          onChange: (v) =>
                            updateData('experience', (p: any) =>
                              p.map((i: any) =>
                                i.id === exp.id ? { ...i, company: v } : i
                              )
                            ),
                          placeholder: 'Company Name',
                        })}
                        {renderInput({
                          label: 'Duration',
                          value: exp.duration,
                          onChange: (v) =>
                            updateData('experience', (p: any) =>
                              p.map((i: any) =>
                                i.id === exp.id ? { ...i, duration: v } : i
                              )
                            ),
                          placeholder: 'Start Date – End Date',
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
                        placeholder: 'Describe your key responsibilities and achievements...',
                        isTextarea: true,
                        section: 'experience',
                        id: exp.id,
                        field: 'responsibilities',
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 5 — Projects */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">Projects</h2>
                    <Button
                      onClick={() =>
                        addArrayItem('projects', { name: '', stack: '', description: '' })
                      }
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Project
                    </Button>
                  </div>

                  {data.projects.map((proj: any) => (
                    <div
                      key={proj.id}
                      className="relative rounded-2xl border border-emerald-500/10 bg-black/20 p-6"
                    >
                      <button
                        onClick={() => removeArrayItem('projects', proj.id)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderInput({
                          label: 'Project Name',
                          value: proj.name,
                          onChange: (v) =>
                            updateData('projects', (p: any) =>
                              p.map((i: any) =>
                                i.id === proj.id ? { ...i, name: v } : i
                              )
                            ),
                          placeholder: 'Project Name',
                        })}
                        {renderInput({
                          label: 'Tech Stack',
                          value: proj.stack,
                          onChange: (v) =>
                            updateData('projects', (p: any) =>
                              p.map((i: any) =>
                                i.id === proj.id ? { ...i, stack: v } : i
                              )
                            ),
                          placeholder: 'Technology 1, Technology 2...',
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
                        placeholder: 'Describe the project and your contributions...',
                        isTextarea: true,
                        section: 'projects',
                        id: proj.id,
                        field: 'description',
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 6 — Extras */}
              {step === 6 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold">Extra Details</h2>
                  {renderInput({
                    label: 'Certifications',
                    value: data.extras.certifications,
                    onChange: (v) => updateData('extras', { certifications: v }),
                    placeholder: 'Certification Name, Issuing Organization...',
                    isTextarea: true,
                  })}
                  {renderInput({
                    label: 'Awards',
                    value: data.extras.awards,
                    onChange: (v) => updateData('extras', { awards: v }),
                    placeholder: 'Award Name, Recognizing Body...',
                    isTextarea: true,
                  })}
                  {renderInput({
                    label: 'Hobbies',
                    value: data.extras.hobbies,
                    onChange: (v) => updateData('extras', { hobbies: v }),
                    placeholder: 'Hobby 1, Hobby 2...',
                  })}
                </div>
              )}

              {/* Step 7 — Summary */}
              {step === 7 && (
                <div className="space-y-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">Final Summary</h2>
                      <p className="mt-1 text-emerald-100/60">
                        AI will craft a profile based on your education and skills.
                      </p>
                    </div>
                    <Button
                      onClick={handleAiWriteSummary}
                      disabled={isAiLoading}
                      className="mb-1 gap-2 bg-emerald-600 shadow-lg shadow-emerald-900/40 hover:bg-emerald-500"
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
                    placeholder: 'Write a brief professional summary highlighting your key qualifications...',
                    isTextarea: true,
                    section: 'personalInfo',
                    field: 'summary',
                  })}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-10 flex justify-between border-t border-white/5 pt-6">
              {step > 0 ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 8 && (
                <Button
                  className="rounded-xl bg-emerald-600 px-10 shadow-lg shadow-emerald-900/20 hover:bg-emerald-500"
                  onClick={() => setStep((s) => s + 1)}
                >
                  {step === 7 ? 'Finalize & Preview' : 'Next Section'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 8 — PDF Preview                                              */}
        {/* ----------------------------------------------------------------- */}
        {step === 8 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Final Preview</h2>

              <PDFDownloadLink
                document={<ResumePDF data={data} />}
                fileName="Resume_Pro.pdf"
              >
                {/* @ts-ignore */}
                {({ loading }) => (
                  <Button className="bg-emerald-600 shadow-xl shadow-emerald-900/30 hover:bg-emerald-500">
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'Baking PDF…' : 'Download Resume'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>

            <div className="h-[650px] overflow-hidden rounded-3xl border border-emerald-500/20 bg-white shadow-2xl">
              <PDFViewer width="100%" height="100%" showToolbar={false} className="rounded-3xl">
                <ResumePDF data={data} />
              </PDFViewer>
            </div>

            <Button
              variant="ghost"
              onClick={() => setStep(7)}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Editor
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="space-x-6 pb-6 text-center text-sm text-emerald-100/40">
        <span>© {new Date().getFullYear()} AI Resume Pro.</span>
        
        <Link
          href="/how-to-use"
          className="underline decoration-emerald-500/20 underline-offset-4 hover:text-emerald-400"
        >
          How to Use
        </Link>
        <span>|</span>
        <Link
          href="/privacy"
          className="underline decoration-emerald-500/20 underline-offset-4 hover:text-emerald-400"
        >
          Privacy
        </Link>
        <span>|</span>
        <Link
          href="/terms"
          className="underline decoration-emerald-500/20 underline-offset-4 hover:text-emerald-400"
        >
          Terms
        </Link>
      </footer>
    </div>
  );
}