'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Box, CarFront, CircleCheck, Cog, DollarSign, Download, Droplets, Gauge, Layers, Mail, MapPin, Phone, Printer, ScanSearch, ShieldCheck, Sofa, Star, SwitchCamera, Wrench, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';

type AppView = 'landing' | 'intake' | 'scanner';
type FocusArea = 'Engine Bay' | 'Undercarriage' | 'Interior' | 'Exterior' | '';
type IntakeData = { year: string; make: string; model: string; trim: string; color: string; colorOther: string; mileage: number; focusArea: FocusArea; symptom: string };
type Detection = { label: string; confidence: number; box: { x: number; y: number; w: number; h: number } };
type MechanicPartner = { name: string; rating: number; distance: string; estimatedCost: string; phone: string; email: string };
type DiagnoseResponse = { status: 'success' | 'error'; diagnosis?: string; detections?: Detection[]; detail?: string };
type AcousticTelemetry = { frequency: string; status: string; signature: string };

const DigitalTwin = dynamic(() => import('../components/DigitalTwin'), { ssr: false });
const TOTAL_STEPS = 5;
const COLOR_OPTIONS = ['Black','White','Silver','Gray','Blue','Red'];

export default function HomePage() {
  const [appView, setAppView] = useState<AppView>('landing');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IntakeData>({ year: '', make: '', model: '', trim: '', color: '', colorOther: '', mileage: 45000, focusArea: '', symptom: '' });
  const progress = useMemo(() => (step / TOTAL_STEPS) * 100, [step]);

  return <main className="min-h-screen bg-slate-950 text-white">{appView==='landing' && <section className="p-10"><h1 className="text-4xl">Mechanicure</h1><button onClick={()=>setAppView('intake')}>Start Diagnostics</button></section>}
  {appView==='intake' && <section className="p-10"><h2>Vehicle Setup</h2><div className="h-2 bg-slate-800"><div className="h-2 bg-cyan-400" style={{width:`${progress}%`}}/></div><input value={form.year} onChange={e=>setForm({...form,year:e.target.value})} placeholder="Year" /><input value={form.make} onChange={e=>setForm({...form,make:e.target.value})} placeholder="Make" /><input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} placeholder="Model" /><input value={form.trim} onChange={e=>setForm({...form,trim:e.target.value})} placeholder="Trim" /><button onClick={()=>setAppView('scanner')}>Launch AR Scanner</button></section>}
  {appView==='scanner' && <ScannerView intakeData={form} onBack={()=>setAppView('intake')} />}</main>;
}

function ScannerView({ intakeData, onBack }: { intakeData: IntakeData; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sendingRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [error, setError] = useState('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [acousticData, setAcousticData] = useState<AcousticTelemetry | null>(null);
  const [mechanics, setMechanics] = useState<MechanicPartner[]>([]);
  const [facingMode, setFacingMode] = useState<'user'|'environment'>('environment');

  const fetchMechanics = async (lat:number,lng:number) => { try { const r=await fetch(`http://127.0.0.1:8000/api/mechanics?lat=${lat}&lng=${lng}`); if(r.ok) setMechanics(await r.json()); } catch (e) { console.error(e);} };

  const triggerDemoSuccess = () => {
    setLoading(false);
    setDiagnosis("Diagnostic Report: \n - Vehicle Profile Match: 2024 Hyundai Palisade Calligraphy. \n - Component Identified: Serpentine belt and tensioner assembly. \n - Reported Symptom: Hearing a high-pitched whine. \n - Active NHTSA Recalls Found: 0. \n - Status: Scanning continuous telemetry... minor wear detected.");
    setDetections([{ label: 'Serpentine Belt', confidence: 0.94, box: { x: 150, y: 200, w: 280, h: 120 } }]);
    setAcousticData({ frequency: '4.2 kHz', status: 'ANOMALY DETECTED', signature: 'High-pitch belt squeal' });
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => void fetchMechanics(p.coords.latitude, p.coords.longitude));
  };

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: true });
      if (!videoRef.current) return;
      streamRef.current?.getTracks().forEach(t=>t.stop());
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const track = stream.getAudioTracks()[0];
      if (track) {
        const recorder = new MediaRecorder(new MediaStream([track]), { mimeType: 'audio/webm' });
        recorder.ondataavailable = (event) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            if (typeof reader.result !== 'string') return;
            const audio = reader.result.split(',')[1];
            const res = await fetch('/api/analyze-audio', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ audio, mimeType: 'audio/webm' }) });
            if (res.ok) setAcousticData(await res.json());
          }; reader.readAsDataURL(event.data);
        };
        recorder.start(5000); mediaRecorderRef.current = recorder;
      }
    };
    void init();
    return () => { mediaRecorderRef.current?.state !== 'inactive' && mediaRecorderRef.current?.stop(); streamRef.current?.getTracks().forEach(t=>t.stop()); };
  }, [facingMode]);

  const captureAndDiagnose = async () => {
    if (!videoRef.current || !canvasRef.current || sendingRef.current) return;
    sendingRef.current = true; setLoading(true);
    try {
      const video = videoRef.current; const canvas = canvasRef.current;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
      const blob = await new Promise<Blob | null>(r=>canvas.toBlob(r,'image/jpeg',0.92));
      if (!blob) return;
      const fd = new FormData(); fd.append('file', new File([blob], 'frame.jpg', { type: 'image/jpeg' })); fd.append('intake', JSON.stringify(intakeData));
      const res = await fetch('/api/diagnose', { method:'POST', body: fd });
      const data: DiagnoseResponse = await res.json();
      setDiagnosis(data.diagnosis || 'No diagnosis'); setDetections(data.detections || []);
    } finally { setLoading(false); sendingRef.current = false; }
  };

  const primaryPartName = detections[0]?.label || 'Serpentine Belt';
  const cadHref = `/cad/${primaryPartName.toLowerCase().replace(/[^a-z0-9]+/g,'_')}.stl`;

  return <div className="relative min-h-screen bg-black text-white font-mono">
    <button onClick={onBack} className="absolute left-4 top-4 z-40 rounded-md border border-white/30 bg-black/40 px-4 py-2 text-xs">Back</button>
    <button type="button" onClick={triggerDemoSuccess} className="absolute right-4 top-4 z-40 rounded-md border border-emerald-300/40 bg-slate-950/65 px-4 py-2 text-xs uppercase tracking-[0.16em] text-emerald-100 backdrop-blur-md transition hover:bg-emerald-500/20"> Skip Scan (Demo) </button>
    <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" autoPlay muted playsInline />
    <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" />
    <div className="absolute left-1/2 top-1/2 z-20 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/70" />
    <button onClick={()=>void captureAndDiagnose()} className="absolute bottom-8 left-1/2 z-30 h-16 w-16 -translate-x-1/2 rounded-full bg-white ring-4 ring-white/30" />
    <button onClick={()=>setFacingMode(p=>p==='environment'?'user':'environment')} className="absolute bottom-10 right-8 z-30 rounded-full border border-white/30 bg-black/50 p-4"><SwitchCamera className="h-6 w-6"/></button>
    <div className="absolute bottom-24 left-4 right-4 z-30 space-y-3">
      <div className="rounded-xl border border-white/20 bg-black/45 p-4">{loading?'Analyzing...':diagnosis}</div>
      {acousticData && <div className="rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4">{acousticData.frequency} · {acousticData.status} · {acousticData.signature}</div>}
      {diagnosis && <div className="rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4"><a href={cadHref} download className="inline-flex items-center gap-2"><Download className="h-4 w-4"/>Download STL: {primaryPartName}</a></div>}
      {diagnosis && <div className="rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4"><div className="h-64"><DigitalTwin color={intakeData.color} /></div></div>}
    </div>
    <canvas ref={canvasRef} className="hidden" />
  </div>;
}
