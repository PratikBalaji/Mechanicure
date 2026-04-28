'use client';

import { useEffect, useRef, useState } from 'react';

type DiagnoseResponse = {
  status: 'success' | 'error';
  filename?: string;
  diagnosis?: string;
  detail?: string;
};

const CAPTURE_INTERVAL_MS = 5000;
const BACKEND_URL = 'http://127.0.0.1:8000/diagnose/';

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<number | null>(null);
  const sendingRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [error, setError] = useState<string>('');

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
    };
  }, []);

  useEffect(() => {
    if (!cameraReady) return;

    const captureAndDiagnose = async () => {
      if (!videoRef.current || !canvasRef.current || sendingRef.current) return;

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

        const frameFile = new File([blob], `ar-frame-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        const formData = new FormData();
        formData.append('file', frameFile);

        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const data: DiagnoseResponse = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.detail || 'Diagnostic service returned an error.');
        }

        setDiagnosis(data.diagnosis || 'No diagnosis text was provided.');
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unexpected error while diagnosing frame.');
      } finally {
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 sm:p-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-cyan-400/30 bg-black shadow-[0_0_80px_rgba(34,211,238,0.25)]">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-56 w-56 rounded-2xl border-2 border-cyan-300/90 shadow-[0_0_25px_rgba(34,211,238,0.9)] md:h-72 md:w-72">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/70" />
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-300/70" />
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100 bg-cyan-200/40 shadow-[0_0_18px_rgba(125,211,252,1)]" />
            </div>
          </div>

          <div className="absolute left-4 top-4 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2 text-sm backdrop-blur-lg">
            {cameraReady ? 'AR Camera Online' : 'Connecting camera...'}
          </div>

          {(loading || diagnosis || error) && (
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm backdrop-blur-xl sm:text-base">
              {loading && (
                <div className="flex items-center gap-3 text-cyan-200">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent" />
                  Analyzing live frame...
                </div>
              )}

              {!loading && diagnosis && (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-[0.2em] text-cyan-200/80">Latest Diagnosis</p>
                  <p className="text-white/95">{diagnosis}</p>
                </div>
              )}

              {!loading && error && <p className="text-rose-300">{error}</p>}
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
