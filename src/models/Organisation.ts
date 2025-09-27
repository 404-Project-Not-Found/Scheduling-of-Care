/**
 * Filename: /models/Organisation.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// Represents a single invite code for a user to join an organisation
export interface IInviteCode {
  code: string;
  role: 'management' | 'carer';
  used: boolean;
  expiresAt: Date;
}

// Represents an organisation in the system
export interface IOrganisation extends Document {
  name: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  inviteCodes: IInviteCode[];
  generateInviteCode(role: 'management' | 'carer'): IInviteCode;
}

// Defines how invite codes are stored in MongoDB
const InviteCodeSchema = new Schema<IInviteCode>({
  code: { type: String, required: true },
  role: { type: String, enum: ['management', 'carer'], required: true },
  expiresAt: {
    type: Date,
    // Expires after 7 days from creation
    default: () => new Date(Date.now() + 7 * 24 * 69 * 69 * 1000),
  },
  used: { type: Boolean, default: false },
});

// Defines how organisations are stored in DB
const OrganisationSchema = new Schema<IOrganisation>({
  name: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  inviteCodes: [InviteCodeSchema],
});

// Adds a new invite code to the organisation for a specified role
OrganisationSchema.methods.generateInviteCode = function (
  role: 'management' | 'carer'
): IInviteCode {
  let code: string;

  // Generates a random 3-byte hex code, repeat if collision occurs
  do {
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
  } while (this.inviteCodes.some((c: IInviteCode) => c.code === code));

  const invite: IInviteCode = {
    code,
    role,
    used: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  // Add invite code to organisation's invite codes array
  this.inviteCodes.push(invite);
  return invite;
};

// Use existing model if already compiled to prevent recompilation errors
export default (mongoose.models.Organisation as Model<IOrganisation>) ||
  mongoose.model<IOrganisation>('Organisation', OrganisationSchema);
