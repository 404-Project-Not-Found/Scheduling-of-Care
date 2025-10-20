import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICarer extends Document {
  name: string;
  email: string;
  organisation: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CarerSchema: Schema = new Schema<ICarer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    organisation: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Carer ||
  mongoose.model<ICarer>('Carer', CarerSchema);
