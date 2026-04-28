import mongoose, { Model, Schema } from 'mongoose';

export interface IntakeDocument {
  year: string;
  make: string;
  model: string;
  trim: string;
  color: string;
  colorOther: string;
  mileage: number;
  focusArea: string;
  symptom: string;
  createdAt: Date;
  updatedAt: Date;
}

const IntakeSchema = new Schema<IntakeDocument>(
  {
    year: { type: String, required: true, trim: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    trim: { type: String, required: true, trim: true },
    color: { type: String, default: '', trim: true },
    colorOther: { type: String, default: '', trim: true },
    mileage: { type: Number, required: true, min: 0 },
    focusArea: { type: String, default: '', trim: true },
    symptom: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
  }
);

const Intake: Model<IntakeDocument> =
  (mongoose.models.Intake as Model<IntakeDocument>) || mongoose.model<IntakeDocument>('Intake', IntakeSchema);

export default Intake;
