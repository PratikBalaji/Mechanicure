import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const NHTSA_BASE_URL = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

type IntakeContext = {
  year?: string;
  make?: string;
  model?: string;
  symptom?: string;
};

type GeminiDetection = {
  label: string;
  confidence: number;
  box: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

type GeminiResponsePayload = {
  diagnosis: string;
  detections: GeminiDetection[];
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const extractJsonObject = (raw: string): GeminiResponsePayload => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Gemini did not return JSON content.');
  }

  const parsed = JSON.parse(match[0]) as Partial<GeminiResponsePayload>;

  if (typeof parsed.diagnosis !== 'string' || !Array.isArray(parsed.detections)) {
    throw new Error('Gemini JSON shape is invalid.');
  }

  const detections: GeminiDetection[] = parsed.detections.map((det) => ({
    label: String(det?.label ?? 'Unknown Component'),
    confidence: Number(det?.confidence ?? 0),
    box: {
      x: Number(det?.box?.x ?? 0),
      y: Number(det?.box?.y ?? 0),
      w: Number(det?.box?.w ?? 0),
      h: Number(det?.box?.h ?? 0),
    },
  }));

  return {
    diagnosis: parsed.diagnosis,
    detections,
  };
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const intakeRaw = formData.get('intake');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Frame file is required.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const intake: IntakeContext = intakeRaw ? JSON.parse(String(intakeRaw)) : {};
    const vehicleYear = intake.year || 'Unknown Year';
    const vehicleMake = intake.make || 'Unknown Make';
    const vehicleModel = intake.model || 'Unknown Model';
    const symptom = intake.symptom || 'No symptom reported';

    let recallsCount = 0;

    // Keep NHTSA logic intact.
    if (intake.year && intake.make && intake.model) {
      const recallUrl = `${NHTSA_BASE_URL}?make=${encodeURIComponent(intake.make)}&model=${encodeURIComponent(intake.model)}&modelYear=${encodeURIComponent(intake.year)}`;
      const response = await fetch(recallUrl, { method: 'GET', cache: 'no-store' });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.results)) {
          recallsCount = data.results.length;
        }
      }
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64Image = Buffer.from(bytes).toString('base64');
    const systemPrompt = `You are an expert mechanic. Analyze this image of a ${vehicleYear} ${vehicleMake} ${vehicleModel}. The user's symptom is ${symptom}. Identify the primary automotive component in view. Return ONLY a valid JSON object matching this exact structure: { "diagnosis": "Brief string analyzing the part's condition", "detections": [ { "label": "Part Name", "confidence": 0.95, "box": { "x": 150, "y": 150, "w": 200, "h": 200 } } ] } `;
main

    const geminiResult = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: file.type || 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const geminiText = geminiResult.text ?? '';
    const parsed = extractJsonObject(geminiText);

    return NextResponse.json({
      status: 'success',
      diagnosis: [
        'Diagnostic Report:',
        `- Vehicle Profile Match: ${vehicleYear} ${vehicleMake} ${vehicleModel}.`,
        `- Reported Symptom: ${symptom}.`,
        `- Active NHTSA Recalls Found: ${recallsCount}.`,
        `- AI Analysis: ${parsed.diagnosis}`,
      ].join('\n'),
      detections: parsed.detections,
      frameName: file.name,
    });
  } catch (error) {
    console.error('Diagnose route error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process diagnostic frame.' }, { status: 500 });
  }
}
