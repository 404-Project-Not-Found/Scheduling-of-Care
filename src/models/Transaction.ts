
import {Schema, model, models, Types, Document, Model} from 'mongoose';

type TrKind = 'Purchase' | 'Refund';

export interface IOTransactionLine {
  categoryId: Schema.Types.ObjectId;
  careItemSlug: string;
  label?: string;
  amount: number;
  refundOfTransId?: Types.ObjectId;
  refundOfLineId?: Types.ObjectId;
}

export interface TransactionDoc extends Document {
  clientId: Types.ObjectId;
  year: number;
  date: Date;
  type: TrKind;
  madeByUserId: string;
  receiptUrl?: string;
  lines: (IOTransactionLine & Document)[];
  note?: string;
  voidedAt?: Date;
}

const TransactionLineSchema = new Schema(
  {
    categoryId: {type: Schema.Types.ObjectId, ref: 'Category', required: true},
    careItemSlug: {type: String, required: true, lowercase: true, index: true},
    label: {type: String},
    amount: {type: Number, required: true, min: 0},
    refundOfTransId: {type: Schema.Types.ObjectId, ref: 'Transaction'}, //Tie back to original purchase
    refundOfLineId: {type: Schema.Types.ObjectId} // Object id of original line
  }, {_id: true}
);

const TransactionSchema = new Schema(
  {
    clientId: {type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true},
    year: {type: Number, required: true, index: true},
    date: {type: Date, required: true},
    type: {type: String, enum: ['Purchase', 'Refund'], required: true},
    madeByUserId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    receiptUrl: {type: String},
    lines: {
      type: [TransactionLineSchema], 
      default:[], 
      validate: {
        validator(v: unknown): boolean {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one line required',
      },
    },
    note: String,
    voidedAt: Date,
  }, {timestamps: true}
);

TransactionSchema.index({clientId: 1, year: 1, date: 1});

export const Transaction: Model<TransactionDoc> = models.Transaction || model<TransactionDoc>('Transaction', TransactionSchema);