'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { CarFront, CheckCircle2, Cog, Droplets, Gauge, ScanSearch, Sofa, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';

type FocusArea = 'Engine Bay' | 'Undercarriage' | 'Interior' | 'Exterior' | '';

type IntakeData = {
  year: string;
  make: string;
  model: string;
  trim: string;
  color: string;
  colorOther: string;
  mileage: number;
  focusArea: FocusArea;
  symptom: string;
};

const TOTAL_STEPS = 5;

const COLOR_OPTIONS = [
  { name: 'Black', className: 'bg-zinc-900' },
  { name: 'White', className: 'bg-zinc-100' },
  { name: 'Silver', className: 'bg-slate-400' },
  { name: 'Gray', className: 'bg-slate-600' },
  { name: 'Blue', className: 'bg-blue-500' },
  { name: 'Red', className: 'bg-red-500' },
];

const FOCUS_OPTIONS: { label: Exclude<FocusArea, ''>; icon: typeof Wrench }[] = [
  { label: 'Engine Bay', icon: Wrench },
  { label: 'Undercarriage', icon: CarFront },
  { label: 'Interior', icon: Sofa },
  { label: 'Exterior', icon: ScanSearch },
];

const stepMotion = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: 'easeInOut' as const },
};

export default function IntakePage() {
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<IntakeData>({
    year: '',
    make: '',
    model: '',
    trim: '',
    color: '',
    colorOther: '',
    mileage: 45000,
    focusArea: '',
    symptom: '',
  });

  const progress = useMemo(() => (step / TOTAL_STEPS) * 100, [step]);

  const updateForm = <K extends keyof IntakeData>(key: K, value: IntakeData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (saved) setSaved(false);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const saveIntake = () => {
    localStorage.setItem('mechanicure_intake', JSON.stringify(form));
    setSaved(true);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Mechanicure Intake</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Vehicle Pre-Scan Setup</h1>
          </div>
          <div className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-1 text-xs tracking-[0.2em] text-cyan-200">
            STEP {step}/{TOTAL_STEPS}
          </div>
        </div>

        <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_70px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section key="step-1" {...stepMotion} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Vehicle Identity</h2>
                  <p className="mt-1 text-sm text-slate-300">Let&apos;s define exactly what you&apos;re driving.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { key: 'year', label: 'Year', placeholder: '2024' },
                    { key: 'make', label: 'Make', placeholder: 'Hyundai' },
                    { key: 'model', label: 'Model', placeholder: 'Palisade' },
                    { key: 'trim', label: 'Trim', placeholder: 'Calligraphy' },
                  ].map((field) => (
                    <label key={field.key} className="space-y-2">
                      <span className="text-sm text-slate-300">{field.label}</span>
                      <input
                        value={form[field.key as keyof IntakeData] as string}
                        onChange={(e) => updateForm(field.key as keyof IntakeData, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-cyan-300/20 bg-slate-900/80 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/60"
                      />
                    </label>
                  ))}
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section key="step-2" {...stepMotion} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Vehicle Color</h2>
                  <p className="mt-1 text-sm text-slate-300">Choose your vehicle color for better visual matching.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {COLOR_OPTIONS.map((color) => {
                    const active = form.color === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => updateForm('color', color.name)}
                        className={`group rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-cyan-300 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                            : 'border-white/10 bg-slate-900/60 hover:border-cyan-300/40'
                        }`}
                      >
                        <div className={`mb-2 h-8 w-full rounded-md ${color.className}`} />
                        <div className="text-sm">{color.name}</div>
                      </button>
                    );
                  })}
                </div>

                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Other color (optional)</span>
                  <div className="relative">
                    <Droplets className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
                    <input
                      value={form.colorOther}
                      onChange={(e) => updateForm('colorOther', e.target.value)}
                      placeholder="Pearl beige, matte green, etc."
                      className="w-full rounded-xl border border-cyan-300/20 bg-slate-900/80 py-3 pl-10 pr-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
                    />
                  </div>
                </label>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section key="step-3" {...stepMotion} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Current Mileage</h2>
                  <p className="mt-1 text-sm text-slate-300">This helps tailor age-appropriate diagnostic logic.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="mb-3 flex items-center justify-between text-cyan-200">
                    <span className="text-sm uppercase tracking-[0.2em]">Mileage</span>
                    <span className="text-lg font-semibold">{form.mileage.toLocaleString()} mi</span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={300000}
                    step={500}
                    value={form.mileage}
                    onChange={(e) => updateForm('mileage', Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />

                  <label className="mt-4 block space-y-2">
                    <span className="text-sm text-slate-300">Or enter exact value</span>
                    <div className="relative">
                      <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
                      <input
                        type="number"
                        min={0}
                        value={form.mileage}
                        onChange={(e) => updateForm('mileage', Number(e.target.value) || 0)}
                        className="w-full rounded-xl border border-cyan-300/20 bg-slate-900/80 py-3 pl-10 pr-4 text-white outline-none focus:border-cyan-300/60"
                      />
                    </div>
                  </label>
                </div>
              </motion.section>
            )}

            {step === 4 && (
              <motion.section key="step-4" {...stepMotion} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Focus Area</h2>
                  <p className="mt-1 text-sm text-slate-300">Where should AR diagnostics prioritize first?</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {FOCUS_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const active = form.focusArea === item.label;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => updateForm('focusArea', item.label)}
                        className={`rounded-2xl border p-5 text-left transition ${
                          active
                            ? 'border-cyan-300 bg-cyan-500/20 shadow-[0_0_24px_rgba(34,211,238,0.35)]'
                            : 'border-white/10 bg-slate-900/70 hover:border-cyan-300/45'
                        }`}
                      >
                        <Icon className="mb-4 h-6 w-6 text-cyan-200" />
                        <p className="text-base font-medium">{item.label}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {step === 5 && (
              <motion.section key="step-5" {...stepMotion} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Primary Symptom</h2>
                  <p className="mt-1 text-sm text-slate-300">What brings you to Mechanicure today?</p>
                </div>

                <textarea
                  value={form.symptom}
                  onChange={(e) => updateForm('symptom', e.target.value)}
                  placeholder="e.g., Hearing a high-pitched whine during acceleration"
                  rows={5}
                  className="w-full rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
                />

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  Your intake data will be saved and used to personalize AR diagnostic overlays.
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={saveIntake}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/25"
                  >
                    <Cog className="h-4 w-4" /> Save Intake Data
                  </button>

                  <Link
                    href="/"
                    onClick={saveIntake}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:brightness-110"
                  >
                    {saved ? <CheckCircle2 className="h-4 w-4" /> : <ScanSearch className="h-4 w-4" />}
                    {saved ? 'Saved • Launch AR Scanner' : 'Launch AR Scanner'}
                  </Link>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110"
              >
                Continue
              </button>
            ) : (
              <span className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Final Step Complete</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
