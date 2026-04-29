'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Box, CarFront, Cog, DollarSign, Download, Droplets, Gauge, Layers, Mail, MapPin, Phone, Printer, CircleCheck, Zap, ScanSearch, ShieldCheck, Sofa, Star, SwitchCamera, Wrench } from 'lucide-react';
import dynamic from 'next/dynamic';
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

type Detection = { label: string; confidence: number; box: { x: number; y: number; w: number; h: number } };
type MechanicPartner = { name: string; rating: number; distance: string; estimatedCost: string; phone: string; email: string };
type DiagnoseResponse = { status: 'success' | 'error'; diagnosis?: string; detections?: Detection[]; detail?: string };
type AcousticTelemetry = { frequency: string; status: string; signature: string };

const DigitalTwin = dynamic(() => import('../components/DigitalTwin'), { ssr: false });

const TOTAL_STEPS = 5;
const CAPTURE_INTERVAL_MS = 6000;

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


const stepMotion = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.35 } };
const viewMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.3 } };

export default function HomePage() {
  const [appView, setAppView] = useState<AppView>('landing');
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<IntakeData>({ year: '', make: '', model: '', trim: '', color: '', colorOther: '', mileage: 45000, focusArea: '', symptom: '' });
  const progress = useMemo(() => (step / TOTAL_STEPS) * 100, [step]);

  const updateForm = <K extends keyof IntakeData>(key: K, value: IntakeData[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const nextStep = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const saveIntake = async (launchScanner = true) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/intake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error('Failed to save intake data.');
      if (launchScanner) setAppView('scanner');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('intake', JSON.stringify(intakeData));
      const response = await fetch('/api/diagnose', { method: 'POST', body: formData });
      const data: DiagnoseResponse = await response.json();
      if ((data.diagnosis || '').includes('CAR_NOT_FOUND')) { setError('Subject not recognized as a vehicle component.'); setFallbackMode(true); return; }
      setFallbackMode(false);
      setDiagnosis(data.diagnosis || 'No diagnosis text was provided.');
      setDetections(data.detections || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AnimatePresence mode="wait">
        {appView === 'landing' && (
          <motion.section key="landing" {...viewMotion} className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
            <section className="relative mt-20 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_80px_rgba(34,211,238,0.15)] backdrop-blur-2xl sm:p-12">
              <p className="mb-4 text-xs uppercase tracking-[0.34em] text-cyan-300/80">Mechanicure Platform</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Mechanicure: Enterprise AR Auto Diagnostics</h1>
              <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">Premium intake and real-time AI-assisted scan flow.</p>
              <button type="button" onClick={() => setAppView('intake')} className="mt-9 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-8 py-3 font-semibold text-slate-950">Start Diagnostics</button>
            </section>
          </motion.section>
        )}

        {appView === 'intake' && (
          <motion.section key="intake" {...viewMotion} className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-3xl">
              <div className="mb-8 flex items-center justify-between"><h1 className="text-2xl font-semibold">Vehicle Pre-Scan Setup</h1><span className="text-xs text-cyan-200">STEP {step}/{TOTAL_STEPS}</span></div>
              <div className="mb-8 h-2 rounded-full bg-slate-800"><motion.div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" animate={{ width: `${progress}%` }} /></div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
                <AnimatePresence mode="wait">
                  {step === 1 && <motion.section key="s1" {...stepMotion} className="grid gap-4 sm:grid-cols-2">{[{ key: 'year', placeholder: '2024' }, { key: 'make', placeholder: 'Hyundai' }, { key: 'model', placeholder: 'Palisade' }, { key: 'trim', placeholder: 'Calligraphy' }].map((f) => <input key={f.key} value={form[f.key as keyof IntakeData] as string} onChange={(e) => updateForm(f.key as keyof IntakeData, e.target.value)} placeholder={f.placeholder} className="rounded-xl border border-cyan-300/20 bg-slate-900/80 px-4 py-3" />)}</motion.section>}
                  {step === 2 && <motion.section key="s2" {...stepMotion} className="space-y-4"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{COLOR_OPTIONS.map((c) => <button key={c.name} type="button" onClick={() => updateForm('color', c.name)} className="rounded-xl border border-white/10 p-3 text-left"><div className={`mb-2 h-8 rounded-md ${c.className}`} />{c.name}</button>)}</div><input value={form.colorOther} onChange={(e) => updateForm('colorOther', e.target.value)} placeholder="Other color" className="w-full rounded-xl border border-cyan-300/20 bg-slate-900/80 px-4 py-3" /></motion.section>}
                  {step === 3 && <motion.section key="s3" {...stepMotion} className="space-y-4"><input type="range" min={0} max={300000} step={500} value={form.mileage} onChange={(e) => updateForm('mileage', Number(e.target.value))} className="w-full" /><input type="number" value={form.mileage} onChange={(e) => updateForm('mileage', Number(e.target.value) || 0)} className="w-full rounded-xl border border-cyan-300/20 bg-slate-900/80 px-4 py-3" /></motion.section>}
                  {step === 4 && <motion.section key="s4" {...stepMotion} className="grid gap-4 sm:grid-cols-2">{FOCUS_OPTIONS.map((i) => <button key={i.label} type="button" onClick={() => updateForm('focusArea', i.label)} className="rounded-2xl border border-white/10 p-5 text-left"><i.icon className="mb-3" />{i.label}</button>)}</motion.section>}
                  {step === 5 && <motion.section key="s5" {...stepMotion} className="space-y-4"><textarea value={form.symptom} onChange={(e) => updateForm('symptom', e.target.value)} rows={5} placeholder="What brings you in today?" className="w-full rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-4" /><div className="flex gap-3"><button type="button" onClick={() => saveIntake(false)} className="rounded-xl border border-cyan-300/40 px-4 py-2">Save Intake</button><button type="button" onClick={() => saveIntake(true)} disabled={isSaving} className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-slate-900">{isSaving ? 'Saving...' : 'Launch AR Scanner'}</button></div></motion.section>}
                </AnimatePresence>
                <div className="mt-8 flex justify-between"><button onClick={() => (step === 1 ? setAppView('landing') : prevStep())} className="rounded-xl border border-white/10 px-4 py-2">Back</button>{step < TOTAL_STEPS && <button onClick={nextStep} className="rounded-xl bg-cyan-400 px-5 py-2 text-slate-900">Continue</button>}</div>
              </div>
            </div>
          </motion.section>
        )}

        {appView === 'scanner' && <motion.section key="scanner" {...viewMotion}><ScannerView intakeData={form} onBack={() => setAppView('intake')} /></motion.section>}
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sendingRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [error, setError] = useState('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [acousticData, setAcousticData] = useState<AcousticTelemetry | null>(null);
  const [mechanics, setMechanics] = useState<MechanicPartner[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [targetPrice, setTargetPrice] = useState(45000);
  const [annualMaintenance, setAnnualMaintenance] = useState(1200);
  const [annualInsurance, setAnnualInsurance] = useState(2400);
  const [annualFuel, setAnnualFuel] = useState(3000);
  const [fallbackMode, setFallbackMode] = useState(false);

  const mfgData = { quote: '$34.50', materials: ['Carbon Fiber PETG', 'Polycarbonate', 'Nylon 12'], durability: { tensileStrength: '72 MPa', heatDeflection: '110°C', lifespan: '5+ Years' } };

  const fetchMechanics = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/mechanics?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      setMechanics(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: true });
        if (!videoRef.current) return;
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const audioStream = new MediaStream([audioTrack]);
          const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });

          recorder.ondataavailable = (event) => {
            if (!event.data || event.data.size === 0) return;

            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                if (typeof reader.result !== 'string') return;
                const base64 = reader.result.split(',')[1];
                if (!base64) return;

                const response = await fetch('/api/analyze-audio', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audio: base64, mimeType: 'audio/webm' }),
                });

                if (!response.ok) return;
                const audioResult: AcousticTelemetry = await response.json();
                setAcousticData(audioResult);
              } catch (audioErr) {
                console.error(audioErr);
              }
            };
            reader.readAsDataURL(event.data);
          };

          recorder.start(5000);
          mediaRecorderRef.current = recorder;
        }

        setCameraReady(true);
      } catch (err) {
        console.error(err);
        setError('Camera or microphone access denied.');
      }
    };
    initCamera();
  
  const primaryPartName = detections[0]?.label || 'Serpentine Belt';
  const primaryPartSlug = primaryPartName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const cadFileHref = `/cad/${primaryPartSlug || 'serpentine_belt'}.stl`;
  const annualizedCarCost = targetPrice / 5 + annualMaintenance + annualInsurance + annualFuel;
  const recommendedIncome = annualizedCarCost / 0.15;
  return () => { if (pollRef.current) window.clearInterval(pollRef.current); if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop(); if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); };
  }, [facingMode]);

  const captureAndDiagnose = async () => {
      if (!videoRef.current || !canvasRef.current || sendingRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      sendingRef.current = true;
      setLoading(true);
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (!blob) throw new Error('Could not capture frame blob');
        const formData = new FormData();
        formData.append('file', new File([blob], `frame-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        formData.append('intake', JSON.stringify(intakeData));
        const response = await fetch('/api/diagnose', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Diagnostic request failed');
        const data: DiagnoseResponse = await response.json();
        if ((data.diagnosis || '').includes('CAR_NOT_FOUND')) {
          setError('Subject not recognized as a vehicle component.');
          setFallbackMode(true);
          setLoading(false);
          sendingRef.current = false;
          return;
        }
        setFallbackMode(false);
        setDiagnosis(data.diagnosis || 'No diagnosis text was provided.');
        setDetections(data.detections || []);
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => void fetchMechanics(p.coords.latitude, p.coords.longitude));
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unexpected diagnostic error.');
      } finally {
        setLoading(false);
        sendingRef.current = false;
      }
    };
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [cameraReady, intakeData]);

  useEffect(() => {
    if (!videoRef.current || !overlayCanvasRef.current) return;
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    overlay.width = video.clientWidth;
    overlay.height = video.clientHeight;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!detections.length || video.videoWidth === 0 || video.videoHeight === 0) return;
    const sx = overlay.width / video.videoWidth;
    const sy = overlay.height / video.videoHeight;
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 14; ctx.font = '12px monospace';
    detections.forEach((d) => {
      const x = d.box.x * sx; const y = d.box.y * sy; const w = d.box.w * sx; const h = d.box.h * sy;
      ctx.strokeRect(x, y, w, h);
      const label = `${d.label} (${Math.round(d.confidence * 100)}%)`; const lw = ctx.measureText(label).width + 14;
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(2,6,23,.85)'; ctx.fillRect(x, Math.max(2, y - 18), lw, 18);
      ctx.fillStyle = '#67e8f9'; ctx.fillText(label, x + 7, Math.max(14, y - 4)); ctx.shadowBlur = 14;
    });
  }, [detections]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-mono text-white">
      <button onClick={onBack} className="absolute left-4 top-4 z-40 rounded-md border border-white/30 bg-black/40 px-4 py-2 text-xs">Back</button>
      <div className="relative h-screen w-full">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" autoPlay muted playsInline />
        <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" />
        {!fallbackMode && <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/70 shadow-[0_0_30px_rgba(255,255,255,0.2)]" />}

        <button
          type="button"
          onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
          className="absolute bottom-10 right-8 z-30 rounded-full border border-white/30 bg-black/50 p-4 shadow-lg backdrop-blur"
        >
          <SwitchCamera className="h-6 w-6" />
        </button>


        {!fallbackMode && <button type="button" onClick={() => void captureAndDiagnose()} className="absolute bottom-8 left-1/2 z-30 h-16 w-16 -translate-x-1/2 rounded-full bg-white ring-4 ring-white/30 transition hover:scale-105 active:scale-95" />}

        {(loading || diagnosis || error || fallbackMode) && (
          <div className="absolute bottom-24 left-4 right-4 z-30 space-y-3">

            {fallbackMode && (
              <div className="absolute inset-0 z-40 flex items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black/60 p-6 backdrop-blur-md">
                  <h3 className="mb-3 text-lg font-semibold">Upload Manual Photo</h3>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-slate-900/70 px-4 py-6 text-cyan-200">
                    <UploadCloud className="h-5 w-5" />
                    <span>Select image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-white/20 bg-black/45 p-4 backdrop-blur-md">
              {loading && <p>Analyzing frame...</p>}
              {!loading && diagnosis && <p className="whitespace-pre-line">{diagnosis}</p>}
              {!loading && error && <p className="text-rose-300">{error}</p>}
            </div>


            {!loading && acousticData && (
              <div className="rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4 backdrop-blur-md">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase text-cyan-200"><Gauge className="h-4 w-4" />Acoustic Telemetry</div>
                <p className="text-xs text-slate-300">Frequency: <span className="text-cyan-200">{acousticData.frequency}</span></p>
                <p className="text-xs text-slate-300">Status: <span className="text-cyan-200">{acousticData.status}</span></p>
                <p className="text-xs text-slate-300">Signature: <span className="text-cyan-200">{acousticData.signature}</span></p>
              </div>
            )}

            {!loading && diagnosis && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase text-cyan-200"><Box className="h-4 w-4" />Replacement Part Synthesized</div>
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-cyan-300/30 bg-slate-950/55 p-3"><div className="mb-2 flex items-center gap-2 text-xs text-cyan-200"><Layers className="h-4 w-4" />Recommended Materials</div><div className="flex flex-wrap gap-2">{mfgData.materials.map((m) => <span key={m} className="rounded-full border border-cyan-300/45 px-2 py-1 text-[10px]">{m}</span>)}</div></div>
                  <div className="rounded-md border border-teal-300/30 bg-slate-950/55 p-3"><div className="mb-2 flex items-center gap-2 text-xs text-teal-200"><ShieldCheck className="h-4 w-4" />Durability Stats</div><p className="text-xs">Tensile: <span className="text-cyan-200">{mfgData.durability.tensileStrength}</span></p><p className="text-xs">Heat: <span className="text-cyan-200">{mfgData.durability.heatDeflection}</span></p><p className="text-xs">Lifespan: <span className="text-cyan-200">{mfgData.durability.lifespan}</span></p></div>
                  <div className="rounded-md border border-emerald-300/35 bg-slate-950/55 p-3"><div className="mb-2 flex items-center gap-2 text-xs text-emerald-200"><DollarSign className="h-4 w-4" />Estimated Production Quote</div><p className="text-3xl text-emerald-300">{mfgData.quote}</p></div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href={cadFileHref} download className="inline-flex items-center gap-2 rounded-md border border-cyan-300/45 px-4 py-2 text-xs"><Download className="h-4 w-4" /><Box className="h-4 w-4" />Download STL: {primaryPartName}</a>
                  <a href="https://www.shapeways.com/create" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-teal-300/45 px-4 py-2 text-xs"><Printer className="h-4 w-4" />Outsource 3D Print</a>
                </div>
              </motion.div>
            )}

            {!loading && diagnosis && mechanics.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase text-cyan-200"><MapPin className="h-4 w-4" />Local Repair Partners</div>
                <div className="space-y-3">
                  {mechanics.map((shop) => (
                    <div key={shop.name} className="flex flex-col gap-2 rounded-md border border-white/10 bg-slate-950/55 p-3 md:flex-row md:items-center md:justify-between">
                      <div><p className="font-medium">{shop.name}</p><div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300"><span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-300" /> {shop.rating}</span><span>{shop.distance}</span><span className="text-emerald-300">{shop.estimatedCost}</span></div></div>
                      <div className="flex items-center gap-2"><a href={`tel:${shop.phone}`} className="inline-flex items-center gap-1 rounded-md border border-cyan-300/40 px-2.5 py-1.5 text-xs"><Phone className="h-3.5 w-3.5" />Call</a><a href={`mailto:${shop.email}?subject=Quote Request`} className="inline-flex items-center gap-1 rounded-md border border-teal-300/40 px-2.5 py-1.5 text-xs"><Mail className="h-3.5 w-3.5" />Email Quote</a></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}


            {!loading && diagnosis && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase text-cyan-200"><Cog className="h-4 w-4" />Interactive Digital Twin</div>
                <div className="h-64 w-full overflow-hidden rounded-lg border border-white/10 bg-slate-950/60">
<DigitalTwin color={intakeData.color} />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
