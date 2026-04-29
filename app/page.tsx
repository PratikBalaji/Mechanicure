'use client';

import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, CarFront, Cog, DollarSign, Download, Droplets, Gauge, Layers, Mail, MapPin, Phone, Printer, ScanSearch, ShieldCheck, Sofa, Star, Wrench } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type AppView = 'landing' | 'intake' | 'scanner';
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

type Detection = {
  label: string;
  confidence: number;
  box: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

type AcousticTelemetry = {
  frequency: string;
  status: string;
  signature: string;
};

type MechanicPartner = {
  name: string;
  rating: number;
  distance: string;
  estimatedCost: string;
  phone: string;
  email: string;
};

type DiagnoseResponse = {
  status: 'success' | 'error';
  diagnosis?: string;
  detail?: string;
  detections?: Detection[];
  acoustic?: AcousticTelemetry;
};

const TOTAL_STEPS = 5;
const CAPTURE_INTERVAL_MS = 5000;
const WS_URL = 'ws://localhost:8000/ws/diagnose';

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

const getColorHex = (colorName: string) => {
  switch (colorName) {
    case 'Red': return '#ef4444';
    case 'Blue': return '#3b82f6';
    case 'Black': return '#18181b';
    case 'White': return '#f8fafc';
    case 'Silver': return '#94a3b8';
    case 'Gray': return '#475569';
    default: return '#ffffff';
  }
};

function CarModel({ color }: { color: string }) {
  const { scene } = useGLTF('/suv_model.glb');
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) child.material.color.set(getColorHex(color));
    });
  }, [color, scene]);
  return <primitive object={scene} />;
}

const stepMotion = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: 'easeInOut' as const },
};

const viewMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: 'easeInOut' as const },
};

const randomHex = () =>
  Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');

export default function HomePage() {
  const [appView, setAppView] = useState<AppView>('landing');
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
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
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const saveIntake = async (launchScanner = true) => {
    setIsSaving(true);

    // Launch the scanner immediately — don't block on the DB save
    if (launchScanner) {
      setAppView('scanner');
    }

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        console.warn('Intake save returned non-OK status, but scanner launched.');
      }
    } catch (error) {
      console.error('Intake save failed (non-blocking):', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AnimatePresence mode="wait">
        {appView === 'landing' && (
          <motion.section key="landing" {...viewMotion} className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
            <header className="mb-16 flex items-center justify-between">
              <div className="inline-flex items-center gap-4 rounded-2xl border border-cyan-400/30 bg-slate-900/70 px-5 py-3 backdrop-blur-xl">
                <div className="relative h-10 w-10">
                  <div className="absolute left-1/2 top-1/2 h-8 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                  <div className="absolute left-1/2 top-1/2 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.8)]" />
                  <div className="absolute right-0 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border-[3px] border-cyan-200/90 border-l-transparent shadow-[0_0_14px_rgba(34,211,238,0.6)]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/85">Mechanicure</p>
                  <p className="text-sm text-teal-100/90">Enterprise AR Diagnostics</p>
                </div>
              </div>
            </header>

            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_80px_rgba(34,211,238,0.15)] backdrop-blur-2xl sm:p-12">
              <div className="pointer-events-none absolute -top-24 right-[-70px] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-[-70px] h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />

              <p className="mb-4 text-xs uppercase tracking-[0.34em] text-cyan-300/80">Mechanicure Platform</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Mechanicure: Enterprise AR Auto Diagnostics
              </h1>
              <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
                Accelerate inspections with guided intake, augmented overlays, and intelligent diagnostics engineered for modern service operations.
              </p>

              <div className="mt-9">
                <button
                  type="button"
                  onClick={() => setAppView('intake')}
                  className="inline-flex items-center justify-center rounded-xl border border-cyan-200/60 bg-gradient-to-r from-cyan-400 to-teal-400 px-8 py-3 text-base font-semibold text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.55)] transition hover:brightness-110"
                >
                  Start Diagnostics
                </button>
              </div>
            </section>

            <section className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  title: 'Real-Time Telemetry',
                  description: 'Live AR overlays with continuous sensor-aligned diagnostics and intelligent state tracking.',
                },
                {
                  title: 'AI Computer Vision',
                  description: 'Precision component recognition and contextual defect analysis tuned for modern fleets.',
                },
                {
                  title: 'Instant CAD Generation',
                  description: 'Generate structured service artifacts and visual references from captured inspection context.',
                },
              ].map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_0_40px_rgba(15,23,42,0.5)] backdrop-blur-xl"
                >
                  <h2 className="text-lg font-semibold text-cyan-200">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
                </article>
              ))}
            </section>
          </motion.section>
        )}

        {appView === 'intake' && (
          <motion.section key="intake" {...viewMotion} className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
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
                          onClick={() => saveIntake(false)}
                          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/25"
                        >
                          <Cog className="h-4 w-4" /> Save Intake Data
                        </button>

                        <button
                          type="button"
                          onClick={() => saveIntake(true)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isSaving ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                          ) : (
                            <ScanSearch className="h-4 w-4" />
                          )}
                          {isSaving ? 'Saving...' : 'Launch AR Scanner'}
                        </button>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 1) {
                        setAppView('landing');
                        return;
                      }
                      prevStep();
                    }}
                    className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/40"
                  >
                    {step === 1 ? 'Back to Home' : 'Back'}
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
          </motion.section>
        )}

        {appView === 'scanner' && (
          <motion.section key="scanner" {...viewMotion}>
            <ScannerView intakeData={form} onBack={() => setAppView('intake')} />
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

function ScannerView({ intakeData, onBack }: { intakeData: IntakeData; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const locationRequestedRef = useRef(false);
  const sendingRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [acousticData, setAcousticData] = useState<AcousticTelemetry | null>(null);
  const [mechanics, setMechanics] = useState<MechanicPartner[]>([]);
  const [telemetryBurst, setTelemetryBurst] = useState<string[]>([]);

  const fetchMechanics = async (lat: number, lng: number, diagnosisText: string) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/mechanics?lat=${lat}&lng=${lng}&diagnosis=${encodeURIComponent(diagnosisText)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch local repair partners.');
      }

      const data: MechanicPartner[] = await response.json();
      setMechanics(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: true,
        });

        if (!videoRef.current) return;

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
        setCameraReady(true);
      } catch (err) {
        console.error('Camera access failed:', err);
        setError('Camera access denied or unavailable. Please allow camera permission and refresh.');
      }
    };

    initCamera();

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraReady) return;

    const socket = new WebSocket(WS_URL);
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      setError('');
      socket.send(JSON.stringify({ type: 'init_context', data: intakeData }));
    };

    socket.onmessage = (event) => {
      try {
        const data: DiagnoseResponse = JSON.parse(event.data as string);

        if (data.status !== 'success') {
          throw new Error(data.detail || 'Diagnostic service returned an error.');
        }

        const diagnosisText = data.diagnosis || 'No diagnosis text was provided.';
        setDiagnosis(diagnosisText);
        setDetections(data.detections || []);
        setAcousticData(data.acoustic || null);

        if (!locationRequestedRef.current && navigator.geolocation) {
          locationRequestedRef.current = true;
          navigator.geolocation.getCurrentPosition(
            (position) => {
              void fetchMechanics(position.coords.latitude, position.coords.longitude, diagnosisText);
            },
            (geoError) => {
              console.error('Geolocation error:', geoError);
            }
          );
        }

        setLoading(false);
        sendingRef.current = false;
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unexpected websocket response error.');
        setLoading(false);
        sendingRef.current = false;
      }
    };

    socket.onerror = () => {
      setError('WebSocket connection error. Check backend availability.');
      setLoading(false);
      setDetections([]);
      setAcousticData(null);
      setMechanics([]);
      sendingRef.current = false;
    };

    socket.onclose = () => {
      if (cameraReady) {
        setError('WebSocket disconnected.');
      }
      setLoading(false);
      setAcousticData(null);
      sendingRef.current = false;
    };

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [cameraReady, intakeData]);

  useEffect(() => {
    if (!cameraReady) return;

    const captureAndDiagnose = async () => {
      if (!videoRef.current || !canvasRef.current || sendingRef.current) return;
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      sendingRef.current = true;
      setLoading(true);
      setError('');

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas context unavailable');

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.92);
        });

        if (!blob) throw new Error('Could not capture frame blob');

        const frameBuffer = await blob.arrayBuffer();
        socketRef.current.send(frameBuffer);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unexpected error while diagnosing frame.');
        setLoading(false);
        sendingRef.current = false;
      }
    };

    captureAndDiagnose();
    pollRef.current = window.setInterval(captureAndDiagnose, CAPTURE_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, [cameraReady]);

  useEffect(() => {
    setTelemetryBurst(Array.from({ length: 9 }, () => randomHex()));

    const telemetryInterval = window.setInterval(() => {
      setTelemetryBurst(Array.from({ length: 9 }, () => randomHex()));
    }, 900);

    return () => window.clearInterval(telemetryInterval);
  }, []);




  useEffect(() => {
    if (!videoRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const context = overlayCanvas.getContext('2d');
    if (!context) return;

    const displayedWidth = video.clientWidth;
    const displayedHeight = video.clientHeight;

    overlayCanvas.width = displayedWidth;
    overlayCanvas.height = displayedHeight;

    context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (!detections.length || video.videoWidth === 0 || video.videoHeight === 0) return;

    const scaleX = displayedWidth / video.videoWidth;
    const scaleY = displayedHeight / video.videoHeight;

    context.strokeStyle = '#22d3ee';
    context.lineWidth = 2;
    context.shadowColor = '#22d3ee';
    context.shadowBlur = 14;
    context.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

    detections.forEach((detection) => {
      const x = detection.box.x * scaleX;
      const y = detection.box.y * scaleY;
      const w = detection.box.w * scaleX;
      const h = detection.box.h * scaleY;

      context.strokeRect(x, y, w, h);

      const confidencePct = `${Math.round(detection.confidence * 100)}%`;
      const labelText = `${detection.label} (${confidencePct})`;
      const labelWidth = context.measureText(labelText).width + 14;
      const labelX = x;
      const labelY = Math.max(18, y - 8);

      context.shadowBlur = 0;
      context.fillStyle = 'rgba(2, 6, 23, 0.85)';
      context.fillRect(labelX, labelY - 16, labelWidth, 18);

      context.fillStyle = '#67e8f9';
      context.fillText(labelText, labelX + 7, labelY - 3);

      context.shadowBlur = 14;
      context.strokeStyle = '#22d3ee';
    });
  }, [detections]);

  const mfgData = {
    quote: '$34.50',
    materials: ['Carbon Fiber PETG', 'Polycarbonate', 'Nylon 12'],
    durability: {
      tensileStrength: '72 MPa',
      heatDeflection: '110°C',
      lifespan: '5+ Years',
    },
  };

  const generateMockSTL = () => {
    const stlContent = `solid mechanicure_mock_part
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 20 0 0
      vertex 0 20 0
    endloop
  endfacet
endsolid mechanicure_mock_part`;

    const blob = new Blob([stlContent], { type: 'model/stl' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'mechanicure_replacement_part.stl';
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-mono text-white">
      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 top-4 z-40 rounded-md border border-cyan-300/40 bg-slate-950/65 px-4 py-2 text-xs uppercase tracking-[0.16em] text-cyan-100 backdrop-blur-md"
      >
        Back to Intake
      </button>


      <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-4 rounded-md border border-cyan-300/35 bg-slate-900/65 px-4 py-3 text-xs backdrop-blur-md">
        <div className="flex items-end gap-1">
          {[0, 1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className="w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.85)]"
              style={{
                height: `${14 + ((bar * 7) % 18)}px`,
                animation: 'wavePulse 0.9s ease-in-out infinite',
                animationDelay: `${bar * 0.12}s`,
              }}
            />
          ))}
        </div>

        <div className="space-y-0.5 font-mono">
          <p className="text-cyan-100">FREQ: <span className="text-cyan-300">{acousticData?.frequency ?? 'Listening...'}</span></p>
          <p className={acousticData?.status?.includes('ANOMALY') ? 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]' : 'text-cyan-200'}>
            STATUS: {acousticData?.status ?? 'SCANNING'}
          </p>
          <p className="text-teal-200">SIG: {acousticData?.signature ?? 'Acoustic baseline capture'}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18)_0%,rgba(2,6,23,0.9)_58%,rgba(2,6,23,1)_100%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] items-center justify-center p-4 md:p-8">
        <aside className="pointer-events-none absolute left-3 top-3 bottom-3 z-20 hidden w-52 flex-col justify-between rounded-md border border-cyan-400/20 bg-slate-950/40 p-3 text-[11px] tracking-[0.18em] text-cyan-300/90 backdrop-blur-md lg:flex">
          <div>
            <p className="mb-2 text-cyan-100/90">TELEMETRY // LEFT BUS</p>
            <ul className="space-y-1 text-emerald-300/90">
              <li>SYS_TEMP: 84°C</li>
              <li>DATA_LINK: STABLE</li>
              <li>FRAME_RATE: 60FPS</li>
              <li>LIDAR_SYNC: OK</li>
            </ul>
          </div>
          <ul className="space-y-1 text-cyan-300/80">
            {telemetryBurst.slice(0, 5).map((code, idx) => (
              <li key={`left-${code}-${idx}`}>0x{code}</li>
            ))}
          </ul>
        </aside>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-cyan-300/40 bg-black shadow-[0_0_100px_rgba(6,182,212,0.22)]">
          <video ref={videoRef} className="h-full w-full object-cover saturate-125" autoPlay muted playsInline />
          <canvas
            ref={overlayCanvasRef}
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_80%,rgba(16,185,129,0.12)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_5px,rgba(34,211,238,0.06)_6px)]" />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-56 w-56 rounded-md border border-cyan-300/90 shadow-[0_0_30px_rgba(34,211,238,0.85)] md:h-72 md:w-72">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/70" />
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-300/70" />
              <div className="absolute inset-x-3 h-[2px] bg-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.95)]"
                style={{ animation: 'scanline 2.8s ease-in-out infinite alternate' }}
              />
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100 bg-cyan-200/30 shadow-[0_0_20px_rgba(34,211,238,1)]" />
              <div className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-cyan-200" />
              <div className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-cyan-200" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-cyan-200" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-cyan-200" />
            </div>
          </div>

          <div className="absolute left-4 top-4 z-30 flex items-center gap-3 rounded-md border border-cyan-300/40 bg-slate-950/65 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-md">
            <div className="flex items-center gap-2 text-rose-300">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.95)]"
                style={{ animation: 'blinkLive 1s steps(2, start) infinite' }}
              />
              LIVE
            </div>
            <span className="h-3 w-px bg-cyan-200/25" />
            <span>{cameraReady ? 'CAMERA ONLINE' : 'CONNECTING CAMERA...'}</span>
          </div>

          {(loading || diagnosis || error) && (
            <div className="absolute bottom-5 left-5 right-5 z-30 space-y-3">
              <div className="rounded-md border border-cyan-300/45 bg-slate-900/70 p-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(16,185,129,0.2)] backdrop-blur-md md:p-5 md:text-base">
                <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
                  <span>DIAGNOSTIC FEED</span>
                  <span className="text-emerald-300">CHANNEL // PRIMARY</span>
                </div>

                {loading && (
                  <div className="flex items-center gap-3 text-cyan-200">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent" />
                    <span>Analyzing live frame...</span>
                  </div>
                )}

                {!loading && diagnosis && (
                  <p className="whitespace-pre-line leading-relaxed text-cyan-50 drop-shadow-[0_0_10px_rgba(34,211,238,0.35)]">
                    {diagnosis}
                  </p>
                )}

                {!loading && error && <p className="text-rose-300">{error}</p>}
              </div>

              {!loading && diagnosis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="rounded-md border border-teal-300/45 bg-slate-900/70 p-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(45,212,191,0.18)] backdrop-blur-md md:p-5"
                >
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-teal-200/90">
                    <Box className="h-4 w-4" />
                    <span>Replacement Part Synthesized</span>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-cyan-300/30 bg-slate-950/55 p-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-cyan-200/90">
                        <Layers className="h-4 w-4" />
                        Recommended Materials
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mfgData.materials.map((material) => (
                          <span
                            key={material}
                            className="rounded-full border border-cyan-300/45 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-cyan-100"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-teal-300/30 bg-slate-950/55 p-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-teal-200/90">
                        <ShieldCheck className="h-4 w-4" />
                        Durability Stats
                      </div>
                      <div className="space-y-1 font-mono text-[11px]">
                        <p className="text-slate-300">Tensile Strength: <span className="text-cyan-200">{mfgData.durability.tensileStrength}</span></p>
                        <p className="text-slate-300">Heat Deflection: <span className="text-cyan-200">{mfgData.durability.heatDeflection}</span></p>
                        <p className="text-slate-300">Lifespan: <span className="text-cyan-200">{mfgData.durability.lifespan}</span></p>
                      </div>
                    </div>

                    <div className="rounded-md border border-emerald-300/35 bg-slate-950/55 p-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-emerald-200/90">
                        <DollarSign className="h-4 w-4" />
                        Estimated Production Quote
                      </div>
                      <p className="text-3xl font-semibold text-emerald-300 drop-shadow-[0_0_10px_rgba(74,222,128,0.65)]">{mfgData.quote}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={generateMockSTL}
                      className="inline-flex items-center gap-2 rounded-md border border-cyan-300/45 bg-cyan-500/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/25"
                    >
                      <Download className="h-4 w-4" />
                      <Box className="h-4 w-4" />
                      Download .STL File
                    </button>

                    <a
                      href="https://www.shapeways.com/create"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-teal-300/45 bg-teal-500/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-teal-100 transition hover:bg-teal-500/25"
                    >
                      <Printer className="h-4 w-4" />
                      Outsource 3D Print
                    </a>
                  </div>
                </motion.div>
              )}


              {!loading && diagnosis && mechanics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
                  className="rounded-md border border-cyan-300/35 bg-slate-900/70 p-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-md md:p-5"
                >
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cyan-200/90">
                    <MapPin className="h-4 w-4" />
                    <span>Local Repair Partners</span>
                  </div>

                  <div className="space-y-3">
                    {mechanics.map((shop) => (
                      <div
                        key={shop.name}
                        className="flex flex-col gap-2 rounded-md border border-white/10 bg-slate-950/55 p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-cyan-100">{shop.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-300" /> {shop.rating}</span>
                            <span>{shop.distance}</span>
                            <span className="text-emerald-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.45)]">{shop.estimatedCost}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${shop.phone}`}
                            className="inline-flex items-center gap-1 rounded-md border border-cyan-300/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-500/20"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </a>
                          <a
                            href={`mailto:${shop.email}?subject=Quote Request`}
                            className="inline-flex items-center gap-1 rounded-md border border-teal-300/40 bg-teal-500/10 px-2.5 py-1.5 text-xs text-teal-100 transition hover:bg-teal-500/20"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Email Quote
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {!loading && diagnosis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                  className="rounded-md border border-cyan-300/35 bg-slate-900/70 p-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-md md:p-5"
                >
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cyan-200/90">
                    <Cog className="h-4 w-4" />
                    <span>Interactive Digital Twin</span>
                  </div>
                  <div className="h-64 w-full overflow-hidden rounded-lg border border-white/10 bg-slate-950/60">
                    <Canvas camera={{ position: [2.8, 1.4, 3.2], fov: 45 }}>
                      <ambientLight intensity={0.9} />
                      <Environment preset="city" />
                      <OrbitControls autoRotate autoRotateSpeed={1.2} enablePan={false} />
                      <CarModel color={intakeData.color} />
                      <ContactShadows position={[0, -1.1, 0]} opacity={0.35} blur={2.5} scale={8} far={3.5} />
                    </Canvas>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <aside className="pointer-events-none absolute right-3 top-3 bottom-3 z-20 hidden w-52 flex-col justify-between rounded-md border border-emerald-400/20 bg-slate-950/40 p-3 text-[11px] tracking-[0.18em] text-emerald-300/90 backdrop-blur-md lg:flex">
          <div>
            <p className="mb-2 text-emerald-100/90">TELEMETRY // RIGHT BUS</p>
            <ul className="space-y-1 text-cyan-300/90">
              <li>TORQUE_MAP: NOMINAL</li>
              <li>CANBUS_ERR: 0.02%</li>
              <li>SENSOR_GRID: ACTIVE</li>
              <li>GYRO_LOCK: TRUE</li>
            </ul>
          </div>
          <ul className="space-y-1 text-emerald-300/80">
            {telemetryBurst.slice(5).map((code, idx) => (
              <li key={`right-${code}-${idx}`}>0x{code}</li>
            ))}
          </ul>
        </aside>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style jsx global>{`
        @keyframes scanline {
          0% { top: 8%; }
          100% { top: 92%; }
        }

        @keyframes blinkLive {
          0%, 45% { opacity: 1; }
          46%, 100% { opacity: 0.25; }
        }

        @keyframes wavePulse {
          0%, 100% { transform: scaleY(0.55); opacity: 0.65; }
          50% { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
