import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

type AnalyzeAudioRequest = {
  audio?: string;
  mimeType?: string;
};

type AcousticTelemetry = {
  frequency: string;
  status: string;
  signature: string;
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const extractJsonObject = (raw: string): AcousticTelemetry => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Gemini did not return JSON content.');

  const parsed = JSON.parse(match[0]) as Partial<AcousticTelemetry>;

  if (typeof parsed.frequency !== 'string' || typeof parsed.status !== 'string' || typeof parsed.signature !== 'string') {
    throw new Error('Gemini JSON shape is invalid.');
  }

  return {
    frequency: parsed.frequency,
    status: parsed.status,
    signature: parsed.signature,
  };
};

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const body = (await request.json()) as AnalyzeAudioRequest;
    const { audio, mimeType } = body;

    if (!audio || !mimeType) {
      return NextResponse.json({ success: false, error: 'Both audio (base64) and mimeType are required.' }, { status: 400 });
    }

    const prompt = 'You are an automotive acoustic diagnostics AI. Listen to this 5-second audio clip from a running vehicle. Classify any anomalies as one of: BELT_SQUEAL, KNOCKING_ENGINE, BRAKE_GRIND, EXHAUST_LEAK, NORMAL. Return ONLY valid JSON: { "frequency": "Estimated kHz", "status": "ANOMALY DETECTED or NORMAL", "signature": "Description of the sound" }';

    const geminiResult = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: audio,
              },
            },
          ],
        },
      ],
    });

    const parsed = extractJsonObject(geminiResult.text ?? '');

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Audio analyze route error:', error);
    return NextResponse.json({ success: false, error: 'Failed to analyze audio clip.' }, { status: 500 });
  }
}
