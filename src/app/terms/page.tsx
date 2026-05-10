'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- TS Error Fix: Explicitly cast 'ease' properties as const ---
const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, type: 'tween' as const, ease: 'easeOut' as const } 
  }
};

export default function TermsPage() {
  return (
    <div 
      className="relative flex min-h-screen w-full flex-col items-center px-4 py-8 sm:px-6 sm:py-12 overflow-hidden font-sans"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #1e0a3c 0%, #0a0a12 60%, #000000 100%)' }}
    >
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute bottom-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[120px]" 
        />
      </div>

      {/* Back Button Container */}
      <div className="w-full max-w-3xl mb-6 relative z-20">
        <Link href="/">
          <Button variant="ghost" className="text-violet-300 hover:text-white hover:bg-violet-500/20 transition-all px-4 py-2 rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Builder
          </Button>
        </Link>
      </div>

      {/* Main Content Card */}
      <motion.div 
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="glass-card relative z-10 w-full max-w-3xl rounded-[2rem] sm:rounded-[2.5rem] border border-violet-400/20 bg-black/50 p-6 sm:p-8 md:p-12 shadow-2xl shadow-violet-950/50 backdrop-blur-2xl text-violet-100/80 space-y-6 sm:space-y-8"
      >
        {/* subtle inner top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[2.5rem] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

        {/* Brand indicator */}
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/50">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </div>
          <span className="text-sm sm:text-base font-black tracking-tight text-white">
            AICV<span className="text-violet-400">-Pro</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 border-b border-violet-500/20 pb-8">
          <div className="flex-shrink-0 inline-flex p-3 sm:p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20 w-fit">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Terms of Service</h1>
            <p className="text-xs sm:text-sm mt-2 text-violet-300/60 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-violet-300">1. Acceptance of Terms</h2>
          <p className="leading-relaxed text-sm sm:text-base">
            By accessing and using AICV-Pro, you agree to abide by these Terms of Service. If you do not agree with any part of these terms, please do not use the application.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-violet-300">2. Use of the Service</h2>
          <p className="leading-relaxed text-sm sm:text-base">
            AICV-Pro is provided "as is" as a tool to assist you in creating a professional resume. You are entirely responsible for the accuracy, legality, and appropriateness of the information you input into the builder.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-violet-300">3. AI-Generated Content</h2>
          <p className="leading-relaxed text-sm sm:text-base">
            The "AI Write for Me" feature utilizes artificial intelligence to generate text. While we strive for high quality, AI-generated content may contain inaccuracies or hallucinated information. You agree to review, edit, and verify all AI-generated text before using it in professional settings.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-violet-300">4. Limitation of Liability</h2>
          <p className="leading-relaxed text-sm sm:text-base">
            AICV-Pro and its developers shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service. This includes, but is not limited to, lost job opportunities or data loss resulting from browser refreshes or our security-focused 15-minute inactivity wipe.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-violet-300">5. Modifications</h2>
          <p className="leading-relaxed text-sm sm:text-base">
            We reserve the right to modify, update, or discontinue the service at any time without prior notice.
          </p>
        </section>
      </motion.div>
    </div>
  );
}