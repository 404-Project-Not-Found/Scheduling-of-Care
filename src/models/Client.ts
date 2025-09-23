import { Schema, model, models } from 'mongoose';

const ClientSchema = new Schema(
  {
    name: { type: String, required: true },
    dob: { type: String, required: true },
    accessCode: { type: String, required: true },
    avatarUrl: { type: String },
    notes: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default models.Client || model('Client', ClientSchema);
