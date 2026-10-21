'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  FileSearch,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Plane,
} from 'lucide-react';
import { Ticket } from '@/types/database';

interface UploadZoneProps {
  onSuccess?: (ticket: Ticket) => void;
}

const STEPS = [
  { id: 1, title: 'Reading travel document & validating format...', icon: FileSearch },
  { id: 2, title: 'Extracting passenger & itinerary with Vision AI...', icon: Cpu },
  { id: 3, title: 'Running forensic Error Level & metadata analysis...', icon: ShieldCheck },
  { id: 4, title: 'Finalizing boarding pass verification...', icon: CheckCircle },
];

export function UploadZone({ onSuccess }: UploadZoneProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setError(null);
    if (file.size > 15 * 1024 * 1024) {
      setError('File exceeds 15MB limit. Please upload a smaller ticket document.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a PDF or image ticket (JPG, PNG, HEIC, WebP).');
      return;
    }
    setSelectedFile(file);
    startUploadPipeline(file);
  };

  const startUploadPipeline = async (file: File) => {
    setIsProcessing(true);
    setActiveStep(1);
    setError(null);

    // Simulate animated step progression while network executes
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze ticket document.');
      }

      setActiveStep(4);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(data.ticket);
        } else {
          router.push(`/tickets/${data.ticket.id}`);
        }
      }, 700);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      setError(err?.message || 'Processing failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Drop Container */}
      {!isProcessing ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 backdrop-blur-xl ${
            dragActive
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-slate-700/80 bg-slate-900/60 hover:border-amber-400/70 hover:bg-slate-900/90'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/heic,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          {/* Animated Flight Graphic */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/20 via-sky-500/20 to-amber-400/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 mb-6"
          >
            <Plane className="w-10 h-10" />
          </motion.div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
            Drop your travel ticket here
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Upload PDF or image tickets for <span className="text-amber-400 font-semibold">Flights, Trains, or Buses</span>.
            We extract passenger details and inspect authenticity automatically.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20">
            <UploadCloud className="w-4 h-4" />
            <span>Select File From Device</span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs font-mono text-slate-500">
            <span>• PDF, JPG, PNG, HEIC</span>
            <span>• Up to 15MB</span>
            <span>• Multi-page supported</span>
          </div>
        </div>
      ) : (
        /* Sequential Progress State */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-slate-900/90 border border-slate-700/80 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>PROCESSING TICKET CLEARANCE</span>
            </div>
            <h3 className="text-xl font-bold text-white">Analyzing Travel Document</h3>
            <p className="text-xs text-slate-400 font-mono truncate max-w-md mx-auto">
              {selectedFile?.name} ({(Number(selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>

          {/* Sequential Step Items */}
          <div className="space-y-3 pt-4">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isPast = activeStep > step.id;
              const isCurrent = activeStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
                    isPast
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-950/40 border-amber-500/60 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPast
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>

                  <span className="text-xs sm:text-sm font-medium flex-1">
                    {step.title}
                  </span>

                  {isCurrent && (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="flex-1">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
