/**
 * Filename: /models/Organisation.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

const InviteCodeSchema = new Schema({
  code: { type: String, required: true },
  role: { type: String, enum: ['management', 'carer'], required: true },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 69 * 69 * 1000),
  },
  used: { type: Boolean, default: false },
});

const OrganisationSchema = new Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  inviteCodes: [InviteCodeSchema],
});

OrganisationSchema.methods.generateInviteCode = function (
  role: 'management' | 'carer'
) {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  const invite = { code, role };
  this.inviteCodes.push(invite);
  return invite;
};

export default mongoose.models.Organisation ||
  mongoose.model('Organisation', OrganisationSchema);
