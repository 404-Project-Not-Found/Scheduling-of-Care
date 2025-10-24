/**
 * File path: /models/User.ts
 * Author: Denise Alexander
 * Date Created: 16/09/2025
 *
 * Updated by Denise Alexander (7/10/2025): added activeClientId to identify the client the user is
 * currently viewing across pages.
 *
 * Last Updated by Denise Alexander (24/10/2025): added phone number to user schema.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  profilePic?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: 'carer' | 'management' | 'family';
  organisation?: mongoose.Types.ObjectId;
  status?: 'active' | 'inactive';
  activeClientId?: mongoose.Types.ObjectId | null; // the client the user is currently viewing
}

const UserSchema = new Schema<IUser>({
  profilePic: {
    type: String,
    default: null,
  },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['carer', 'management', 'family'],
    required: true,
  },
  organisation: { type: Schema.Types.ObjectId, ref: 'Organisation' },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: function (this: IUser) {
      return this.role === 'carer' || this.role === 'management'
        ? 'active'
        : undefined;
    },
  },
  activeClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null,
  },
});

export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);
