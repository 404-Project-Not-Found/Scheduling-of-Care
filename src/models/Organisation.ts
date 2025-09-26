/**
 * Filename: /models/Organisation.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import mongoose, { Schema } from 'mongoose';

const OrganisationSchema = new Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  inviteCodes: [
    {
      code: String,
      role: { type: String, enum: ['management', 'carer'], required: true },
      expiresAt: Date,
      used: { type: Boolean, default: false },
    },
  ],
});

export default mongoose.models.Organisation ||
  mongoose.model('Organisation', OrganisationSchema);
