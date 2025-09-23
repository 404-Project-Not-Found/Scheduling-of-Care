import { Schema, model, models } from "mongoose";

const ClientSchema = new Schema(
  {
    fullName: { type: String, required: true },
    accessCode: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Client || model("Client", ClientSchema);
