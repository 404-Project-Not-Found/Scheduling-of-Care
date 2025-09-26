/**
 * Filename: /models/Client.ts
 * Author: Denise Alexander
 * Date Created: 23/09/2025
 */

import { Schema, model, models } from 'mongoose';

const ClientSchema = new Schema(
  {
    name: { type: String, required: true },
    dob: { type: String, required: true },
    accessCode: { type: String, required: true },
    avatarUrl: { type: String },
    notes: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organisation: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      required: false,
    },
  },
  { timestamps: true }
);

export default models.Client || model('Client', ClientSchema);
