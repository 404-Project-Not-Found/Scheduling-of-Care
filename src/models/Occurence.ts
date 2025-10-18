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
  careItemId: Types.ObjectId;
  clientId: Types.ObjectId;
  date: Date;
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

const OccurrenceSchema = new Schema({
  careItemId: { type: Schema.Types.ObjectId, ref: 'CareItem', required: true, index: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  date:   { type: Date,   required: true, index: true },
  status: {
    type: String,
    enum: ['Due', 'Overdue', 'Waiting Verification', 'Completed'],
    default: 'DUE'
  },
  files:      { type: [String], default: [] },
  comments:   { type: [String], default: [] },
  doneBy: String, // Id of user
  verifiedBy: String, // Id of user
  doneAt: Date,
  verifiedAt: Date,
}, { timestamps: true });

OccurrenceSchema.index({ careItemId: 1, date: 1 }, { unique: true });

export default mongoose.models.Occurrence || mongoose.model('Occurrence', OccurrenceSchema);
