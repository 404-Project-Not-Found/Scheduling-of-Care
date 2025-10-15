/**
 * File path: /models/FamilyRequest.ts
 * Author: Denise Alexander
 * Date Created: 14/10/2025
 */

import { Schema, model, models } from 'mongoose';

export interface IFamilyRequest {
  clientId: string;
  taskCategory: string;
  taskSubCategory: string;
  details: string;
  reason: string;
  createdAt: Date;
}

const familyRequestSchema = new Schema<IFamilyRequest>({
  clientId: { type: String, required: true },
  taskCategory: { type: String, required: true },
  taskSubCategory: { type: String, required: true },
  details: { type: String, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const FamilyRequest =
  models.FamilyRequest ||
  model<IFamilyRequest>('FamilyRequest', familyRequestSchema);

export default FamilyRequest;
