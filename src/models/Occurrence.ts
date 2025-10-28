/**
 * File path: /models/Occurrence.ts
 * Author: Zahra Rizqita
 * Date Created: 18/10/2025

 */
import mongoose, { Schema, Types } from 'mongoose';

export type OccurrenceStatus =
  | 'Waiting Verification'
  | 'Completed'
  | 'Overdue'
  | 'Due';

export interface IOccurrence extends mongoose.Document {
  careItemSlug: string;
  clientId: Types.ObjectId;
  date: Date;
  dateKey: string;
  status: OccurrenceStatus;
  files: string[];
  comments: string[];
  doneAt?: Date;
  doneBy?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OccurrenceSchema = new Schema(
  {
    careItemSlug: {
      type: String,
      required: true,
      set: (v: string) => (v ?? '').trim().toLowerCase(),
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['Due', 'Overdue', 'Waiting Verification', 'Completed'],
      default: 'Due',
    },
    files: { type: [String], default: [] },
    comments: { type: [String], default: [] },
    doneBy: String, // Id of user
    verifiedBy: String, // Id of user
    doneAt: Date,
    verifiedAt: Date,
  },
  { timestamps: true }
);

OccurrenceSchema.index(
  { clientId: 1, careItemSlug: 1, dateKey: 1 },
  { unique: true, name: 'uniq_client_slug_day' }
);
OccurrenceSchema.index(
  { clientId: 1, date: 1, careItemSlug: 1 },
  { name: 'byClient_date_range_slug' }
);

export default mongoose.models.Occurrence ||
  mongoose.model<IOccurrence>('Occurrence', OccurrenceSchema);
