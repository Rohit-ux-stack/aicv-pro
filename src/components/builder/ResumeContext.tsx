'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { sortChronologically } from '@/lib/utils'; // Imported sorting utility
import { arrayMove } from '@dnd-kit/sortable'; // Drag and Drop array reorder utility

export type ResumeData = {
  personalInfo: {
    fullName: string;
    phone: string;
    email: string;
    location: string;
    linkedin: string;
    github: string;
    website: string; // ⚠️ Reused internally as "Job Profile / Target Role" field
    summary: string;
  };
  education: Array<{ 
    id: string; 
    degree: string; 
    institution: string; 
    board?: string; 
    location?: string; 
    duration?: string; 
    startMonth?: string; 
    startYear?: string; 
    endMonth?: string; 
    endYear?: string; 
    grade: string; 
    coursework?: string; 
    achievements?: string; 
  }>;
  skills: { technical: string; soft: string; tools: string; languages: string; };
  experience: Array<{ 
    id: string; 
    title: string; 
    company: string; 
    location?: string; 
    duration?: string; 
    startMonth?: string; 
    startYear?: string; 
    endMonth?: string; 
    endYear?: string; 
    responsibilities: string; 
  }>;
  projects: Array<{ id: string; name: string; stack: string; description: string; role?: string; link?: string; duration?: string; }>;
  extras: { certifications: string; awards: string; activities?: string; hobbies: string; references: string; };
};

const defaultState: ResumeData = {
  personalInfo: { fullName: '', phone: '', email: '', location: '', linkedin: '', github: '', website: '', summary: '' },
  education: [],
  skills: { technical: '', soft: '', tools: '', languages: '' },
  experience: [],
  projects: [],
  extras: { certifications: '', awards: '', activities: '', hobbies: '', references: 'Available upon request' },
};

const ResumeContext = createContext<{
  data: ResumeData;
  updateData: (section: keyof ResumeData, payload: any) => void;
  addArrayItem: (section: 'education' | 'experience' | 'projects', emptyItem: any) => void;
  removeArrayItem: (section: 'education' | 'experience' | 'projects', id: string) => void;
  reorderArrayItem: (section: 'education' | 'experience' | 'projects', oldIndex: number, newIndex: number) => void;
  sortSection: (section: 'education' | 'experience') => void;
  loadFullData: (parsedData: ResumeData) => void;
} | undefined>(undefined);

const EXPIRY_TIME_MS = 15 * 60 * 1000; // 15 Minutes in milliseconds

export const ResumeProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<ResumeData>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 1. INITIAL LOAD & EXPIRY CHECK ---
  useEffect(() => {
    const savedData = localStorage.getItem('resume_pro_storage');
    const lastSavedTime = localStorage.getItem('resume_pro_timestamp');

    if (savedData && lastSavedTime) {
      const timePassed = Date.now() - parseInt(lastSavedTime, 10);
      
      // If less than 15 minutes have passed, load the data
      if (timePassed < EXPIRY_TIME_MS) {
        try {
          setData(JSON.parse(savedData));
        } catch (e) {
          console.error("Error loading resume data", e);
        }
      } else {
        // Data expired: Clear everything silently
        localStorage.removeItem('resume_pro_storage');
        localStorage.removeItem('resume_pro_step');
        localStorage.removeItem('resume_pro_timestamp');
        console.log("Session expired. Local data cleared.");
      }
    }
    setIsLoaded(true); // ✅ Only start saving AFTER we've loaded
  }, []);

  // --- 2. SAVE ON CHANGE & UPDATE TIMESTAMP ---
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('resume_pro_storage', JSON.stringify(data));
      localStorage.setItem('resume_pro_timestamp', Date.now().toString()); // Reset the 15-min timer
    }
  }, [data, isLoaded]);

  // --- 3. BACKGROUND WATCHER (Clears screen if left idle) ---
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      const lastSavedTime = localStorage.getItem('resume_pro_timestamp');
      if (lastSavedTime) {
        const timePassed = Date.now() - parseInt(lastSavedTime, 10);
        if (timePassed > EXPIRY_TIME_MS) {
          // User went idle for 15+ mins: Wipe data and reload screen
          localStorage.removeItem('resume_pro_storage');
          localStorage.removeItem('resume_pro_step');
          localStorage.removeItem('resume_pro_timestamp');
          window.location.reload(); 
        }
      }
    }, 60000); // Checks every 60 seconds

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Actions
  const updateData = (section: keyof ResumeData, payload: any) => {
    setData((prev) => {
      // Handle payload evaluation
      let updatedSection = typeof payload === 'function' 
        ? payload(prev[section]) 
        : (Array.isArray(prev[section]) ? payload : { ...prev[section], ...payload });

      // NOTE: previously auto-sorted education/experience by date on every
      // single field edit here. That fought manual drag-to-reorder — the
      // moment you edited any field (even an unrelated one like job title),
      // the whole list would silently resort and undo your arrangement.
      // Sorting now only happens on AI-parse import (loadFullData) and
      // on-demand via sortSection(), so drag order always sticks.

      return {
        ...prev,
        [section]: updatedSection
      };
    });
  };

  const sortSection = (section: 'education' | 'experience') => {
    setData((prev) => ({
      ...prev,
      [section]: sortChronologically(prev[section] as any[])
    }));
  };

  const addArrayItem = (section: 'education' | 'experience' | 'projects', emptyItem: any) => {
    setData((prev) => ({
      ...prev,
      [section]: [...(prev[section] as any[]), { ...emptyItem, id: crypto.randomUUID() }]
    }));
  };

  const removeArrayItem = (section: 'education' | 'experience' | 'projects', id: string) => {
    setData((prev) => ({
      ...prev,
      [section]: (prev[section] as any[]).filter(item => item.id !== id)
    }));
  };

  const reorderArrayItem = (section: 'education' | 'experience' | 'projects', oldIndex: number, newIndex: number) => {
    setData((prev) => ({
      ...prev,
      [section]: arrayMove(prev[section] as any[], oldIndex, newIndex),
    }));
  };

  const loadFullData = (parsedData: ResumeData) => {
    // Intercept parsed data from PDF and sort experience and education automatically
    setData({
      ...parsedData,
      experience: Array.isArray(parsedData.experience) ? sortChronologically(parsedData.experience) : [],
      education: Array.isArray(parsedData.education) ? sortChronologically(parsedData.education) : []
    });
  };

  return (
    <ResumeContext.Provider value={{ data, updateData, addArrayItem, removeArrayItem, reorderArrayItem, sortSection, loadFullData }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) throw new Error('useResume must be used within Provider');
  return context;
};
