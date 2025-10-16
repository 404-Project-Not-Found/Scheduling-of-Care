/**
 * File path: /models/FamilyRequest.ts
 * Author: Denise Alexander
 * Date Created: 14/10/2025
 */

import mongoose, { Schema, models } from 'mongoose';

const familyRequestSchema = new Schema(
  {
    clientId: { type: String, required: true },
    task: { type: String, required: true },
    change: { type: String, required: true },
    requestedBy: { type: String, required: true },
    dateRequested: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Pending', 'Implemented'],
      default: 'Pending',
    },
    resolutionDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const FamilyRequest =
  models.FamilyRequest || mongoose.model('FamilyRequest', familyRequestSchema);

export default FamilyRequest;
