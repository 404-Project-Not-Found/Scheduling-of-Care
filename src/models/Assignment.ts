import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssignment extends Document {
  carerId: Types.ObjectId;
  clientId: Types.ObjectId;
  assignedAt: Date;
}

const AssignmentSchema: Schema = new Schema<IAssignment>({
  carerId: { type: Schema.Types.ObjectId, ref: 'Carer', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  assignedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Assignment ||
  mongoose.model<IAssignment>('Assignment', AssignmentSchema);
