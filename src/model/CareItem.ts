import { kMaxLength } from "buffer";
import {Schema, model, models} from "mongoose";

const careItemSchema = new Schema (
    {
        name: { type: String, required: true},
        frequency: { type: String, enum: ["once", "weekly", "monthly"], default: "once"},
        startDate: { type: Date},
        repeatYearly: {type: Boolean, default: false},
        category: { type: String, enum: ["hygiene", "clothing", "medical", "food", "support", "household", "other"], default: "other"},
        status: { type: String, enum: ["pending", "done"], default: "pending"},
    },
    { timestamps: true }
);

const CareItem = models.CareItem || model("CareItem", careItemSchema);
export default CareItem;