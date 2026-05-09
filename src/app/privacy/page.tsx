'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-600/10 blur-[120px]" />

      <div className="mb-8">
        <Link href="/builder">
          <Button variant="ghost" className="text-slate-400 hover:text-white px-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Builder
          </Button>
        </Link>
      </div>

      <div className="glass-card z-10 w-full rounded-[2rem] border border-white/5 bg-black/40 p-8 md:p-12 shadow-2xl text-emerald-100/70 space-y-6">
        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-8">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
            <p className="text-sm mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">1. Data Storage (Local First)</h2>
          <p>At AI Resume Pro, your privacy is our priority. We do <strong>not</strong> store your personal resume data on our servers. All data entered into the resume builder is saved strictly in your browser's Local Storage. If you clear your browser data or do not use the app for 15 minutes, your resume data is permanently deleted from your device.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">2. AI Processing</h2>
          <p>When you use features like "AI Autofill" from a PDF or "AI Write for Me", the text is sent securely to our third-party AI provider (e.g., OpenAI) solely for the purpose of generating your summary or extracting data. This data is not used to train global AI models and is discarded after processing.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">3. Analytics & Cookies</h2>
          <p>We may use minimal analytics to understand how our tool is used (e.g., page views, error tracking) to improve the experience. We do not use tracking cookies for advertising purposes.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">4. Third-Party Services</h2>
          <p>Your resume is generated natively in your browser using React-PDF. The PDF never touches a server during the final generation phase, ensuring your downloaded file remains entirely private.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">5. Contact</h2>
          <p>If you have any questions regarding how your data is handled, please contact the developer.</p>
        </section>
      </div>
    </div>
  );
}