import { NextResponse } from 'next/server';

import dbConnect from '@/lib/mongodb';
import Intake from '@/models/Intake';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const payload = await request.json();
    const intake = await Intake.create(payload);

    return NextResponse.json(
      {
        success: true,
        id: intake._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to save intake:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save intake data.',
      },
      { status: 500 }
    );
  }
}
