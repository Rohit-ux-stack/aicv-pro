'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <div className="pointer-events-none absolute bottom-0 left-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-600/10 blur-[120px]" />

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
            <FileText className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Terms of Service</h1>
            <p className="text-sm mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">1. Acceptance of Terms</h2>
          <p>By accessing and using AI Resume Pro, you agree to abide by these Terms of Service. If you do not agree, please do not use the application.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">2. Use of the Service</h2>
          <p>AI Resume Pro is provided "as is" as a tool to assist you in creating a professional resume. You are responsible for the accuracy, legality, and appropriateness of the information you input into the builder.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">3. AI-Generated Content</h2>
          <p>The "AI Write for Me" feature utilizes artificial intelligence to generate text. While we strive for high quality, AI-generated content may contain inaccuracies. You agree to review, edit, and verify all AI-generated text before using it in professional settings.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">4. Limitation of Liability</h2>
          <p>AI Resume Pro and its developers shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service, including but not limited to lost job opportunities or data loss resulting from browser refreshes or the 15-minute inactivity wipe.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">5. Modifications</h2>
          <p>We reserve the right to modify or discontinue the service at any time without prior notice.</p>
        </section>
      </div>
    </div>
  );
}