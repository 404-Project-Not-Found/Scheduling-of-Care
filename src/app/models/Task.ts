import mongoose, { Schema, model, models} from "mongoose";

export type Unit = "day" | "week" | "month" | "year";

export interface TaskDoc extends mongoose.Document {
    label: string;
    slug: string;
    status: string;
    category: string;
    clientName?: string;
    deleted?: boolean;

    // legacy string field
    frequency?: string;
    lastDone?: Date;

    // structured field
    frequencyDays?: number;     // normalised to days
    frequencyCount?: number;    // user-entered number
    frequencyUnit?: Unit;       // user-chosen unit
    dateFrom?: string;          // YYYY-MM-DD
    dateTo?: string;            // YYYY-MM-DD

    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<TaskDoc> ({
    label: {type: String, required: true, trim: true},
    slug: {type: String, required: true, unique: true, index: true, lowercare: true},
    status: {type: String, required: true, trim: true},
    category: {type: String, required: true, trim: true},
    clientName: {type: String, trim: true},
    deleted: {type: Boolean, default: false},

    // legacy
    frequency: {type: String},
    lastDone: {type: String},

    //structured
    frequencyDays: {type: Number, min: 1},
    frequencyCount: {type: Number, min: 1},
    frequencyUnit: {type: String, enum:["day", "week" ,"month", "year"]},
    dateFrom: {type: String},
    dateTo: {type: String},
}, {timestamps: true});

export default models.Task|| model<TaskDoc>("Task", TaskSchema);