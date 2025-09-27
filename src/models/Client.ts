/**
 * Filename: /models/Client.ts
 * Author: Denise Alexander
 * Date Created: 23/09/2025
 */

import { Schema, model, models, Types } from 'mongoose';

const ClientSchema = new Schema(
  {
    name: { type: String, required: true },
    dob: { type: String, required: true },
    accessCode: { type: String, required: true },
    avatarUrl: { type: String },
    notes: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organisationHistory: {
      type: [
        {
          organisation: {
            type: Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
          },
          status: {
            type: String,
            enum: ['pending', 'approved', 'revoked'],
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default models.Client || model('Client', ClientSchema);
