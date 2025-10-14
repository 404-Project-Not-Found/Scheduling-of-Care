/**
 * Filename: /models/CareItem.ts
 * Author: Zahra Rizqita
 * Date Created: 22/09/2025
 * Updated at: 03/09/2025
 * 
 * Schema for Care Items in the database
 */

import mongoose, { Schema, model, models, type Model, Types} from "mongoose";

export type Unit = "day" | "week" | "month" | "year";

export function isUnit(u: unknown): u is Unit {
    return u === "day" || u === "week" || u === "month" || u === "year";
}

export interface CareItemDoc extends mongoose.Document {
    label: string;
    slug: string;
    status: string;
    category: string;
    clientName: string;
    categoryId: Types.ObjectId;  
    clientId: Types.ObjectId;
    deleted: boolean;

    // legacy string field
    frequency?: string;
    lastDone?: string;

    notes?: string;

    // structured field
    frequencyDays: number;     // normalised to days
    frequencyCount: number;    // user-entered number
    frequencyUnit: Unit;       // user-chosen unit
    dateFrom: string;          // YYYY-MM-DD
    dateTo: string;            // YYYY-MM-DD

    comments: [String];
    
    createdAt: Date;
    updatedAt: Date;
}

const CareItemSchema = new Schema<CareItemDoc> ({
    label: {type: String, required: true, trim: true},
    slug: {type: String, required: true, unique: true, index: true, lowercase: true},
    status: {type: String, required: true, trim: true},
    category: {type: String, required: true, trim: true},
    clientName: {type: String, trim: true},
    categoryId: {type: Schema.Types.ObjectId, ref: "Category", required: true},
    clientId: {type: Schema.Types.ObjectId, ref: "Client", required: true},
    deleted: {type: Boolean, default: false},

    // legacy
    frequency: {type: String},
    lastDone: {type: String},

    notes: {type: String, default: ""},

    //structured
    frequencyDays: {type: Number, min: 1},
    frequencyCount: {type: Number, min: 1},
    frequencyUnit: {type: String, enum:["day", "week" ,"month", "year"]},
    dateFrom: {type: String},
    dateTo: {type: String},
}, {timestamps: true});

CareItemSchema.index({clientId: 1, categoryId: 1, deleted: 1, status: 1});

export default models.CareItem|| model<CareItemDoc>("CareItem", CareItemSchema);