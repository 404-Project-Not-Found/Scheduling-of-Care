/**
 * File path: /models/User.ts
 * Author: Denise Alexander
 * Date Created: 16/09/2025
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: 'carer' | 'management' | 'family';
  organisation?: mongoose.Types.ObjectId;
  status?: 'active' | 'inactive';
}

const UserSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
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
});

export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);
