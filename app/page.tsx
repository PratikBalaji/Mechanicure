'use client';

import { useEffect, useRef, useState } from 'react';

type DiagnoseResponse = {
  status: 'success' | 'error';
  diagnosis?: string;
  detail?: string;
};

const CAPTURE_INTERVAL_MS = 5000;
const WS_URL = 'ws://127.0.0.1:8000/ws/diagnose';

const randomHex = () =>
  Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const sendingRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [telemetryBurst, setTelemetryBurst] = useState<string[]>([]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
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

      const intakeRaw = localStorage.getItem('mechanicure_intake');
      if (!intakeRaw) return;

      try {
        const parsedIntakeData = JSON.parse(intakeRaw);
        socket.send(JSON.stringify({ type: 'init_context', data: parsedIntakeData }));
      } catch (err) {
        console.error('Failed to parse intake context:', err);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data: DiagnoseResponse = JSON.parse(event.data as string);

        if (data.status !== 'success') {
          throw new Error(data.detail || 'Diagnostic service returned an error.');
        }

        setDiagnosis(data.diagnosis || 'No diagnosis text was provided.');
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
      sendingRef.current = false;
    };

    socket.onclose = () => {
      if (cameraReady) {
        setError('WebSocket disconnected.');
      }
      setLoading(false);
      sendingRef.current = false;
    };

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [cameraReady]);

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 font-mono text-white">
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
            <div className="absolute bottom-5 left-5 right-5 z-30 rounded-md border border-cyan-300/45 bg-slate-900/70 p-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(16,185,129,0.2)] backdrop-blur-md md:p-5 md:text-base">
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
      `}</style>
    </main>
  );
}
