import { kMaxLength } from "buffer";
import {Schema, model, models} from "mongoose";

const careItemSchema = new Schema (
    {
        name: { type: String, required: true},
        frequency: { type: String, enum: ["once, weekly, monthly"], default: "once"},
        startDate: { type: Date},
        repeatYearly: {type: Boolean, default: false},
        status: { type: String, enum: ["pending", "done"], default: "pending"},
    }
);

const CareItem = models.CareItem || model("CareItem", careItemSchema);
export default CareItem;