'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, UploadCloud, Edit3, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HowToUsePage() {
  const steps = [
    {
      icon: <UploadCloud className="w-6 h-6 text-emerald-400" />,
      title: "1. Start Your Journey",
      description: "Upload an existing PDF resume to let our AI auto-fill your details, or start completely from scratch."
    },
    {
      icon: <Edit3 className="w-6 h-6 text-emerald-400" />,
      title: "2. Add Your Details",
      description: "Navigate through the sections using the 'Next' and 'Previous' buttons. Fill in your Education, Experience, and Projects."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      title: "3. Use Smart Tags",
      description: "For skills, languages, and job profiles, simply type a word and press 'Enter' or 'Comma' to create a smart chip. You can even paste a comma-separated list!"
    },
    {
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      title: "4. Let AI Write Your Summary",
      description: "Once your details are filled out, go to the final step and click 'AI Write for Me'. Our AI will craft a professional summary based on your profile."
    },
    {
      icon: <Download className="w-6 h-6 text-emerald-400" />,
      title: "5. Preview & Download",
      description: "Review your generated PDF in the live viewer. If everything looks perfect, hit 'Download Resume' to get your ATS-friendly PDF."
    }
  ];

  return (
    <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
      <div className="pointer-events-none absolute top-0 left-[20%] h-[300px] w-[300px] rounded-full bg-emerald-600/10 blur-[100px]" />

      <div className="mb-8">
        <Link href="/builder">
          <Button variant="ghost" className="text-slate-400 hover:text-white px-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Builder
          </Button>
        </Link>
      </div>

      <div className="glass-card z-10 w-full rounded-[2rem] border border-white/5 bg-black/40 p-8 md:p-12 shadow-2xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">How to Use AI Resume Pro</h1>
        <p className="text-emerald-100/60 mb-10 text-lg">Master the resume builder in 5 easy steps.</p>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-black/20 p-6 rounded-2xl border border-emerald-500/10">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {step.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-emerald-100/70 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center border-t border-white/5 pt-8">
          <Link href="/builder">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-10 py-6 text-lg shadow-xl shadow-emerald-900/40">
              Start Building Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}