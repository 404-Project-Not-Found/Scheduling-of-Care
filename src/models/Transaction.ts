
import {Schema, model, models, Types} from 'mongoose';

type TransactionKind = 'Purchase' | 'Refund';

const TransactionLineSchema = new Schema(
  {
    categoryId: {type: Schema.Types.ObjectId, ref: 'Category', required: true},
    careItemSlug: {type: String, required: true, lowercase: true, index: true},
    label: {type: String},
    amount: {type: Number, required: true, min: 0},
    refundOfTransId: {types: Schema.Types.ObjectId, ref: 'Transaction'},
    refundOfLineId: {type: Schema.Types.ObjectId}
  }, {_id: true}
);

const TransactionSchema = new Schema(
  {
    clientId: {type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true},
    year: {type: Number, required: true, index: true},
    date: {type: Date, required: true},
    type: {type: String, enum: ['Purchase', 'Required'], required: true},
    createdByUserId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  }
);

TransactionSchema.index({clientId: 1, year: 1}, {unique: true});

export const Transaction = models.Transaction || model('Transaction', TransactionSchema);