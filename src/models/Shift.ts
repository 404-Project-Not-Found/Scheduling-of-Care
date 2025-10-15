import mongoose, { Schema, model, models } from 'mongoose';

const ShiftSchema = new Schema(
  {
    organisation: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
    label: { type: String, default: 'Custom' },
  },
  { timestamps: true }
);

ShiftSchema.index({ organisation: 1, staff: 1, date: 1 }, { unique: true });

export default models.Shift || model('Shift', ShiftSchema);
