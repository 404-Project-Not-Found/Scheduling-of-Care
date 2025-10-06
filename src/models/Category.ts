/**
 * Filename: /models/Category.ts
 * Author: Zahra Rizqita
 * Date Created: 03/10/2025
 * 
 * Schema for category for care items
 */

import{ Schema, model, models} from "mongoose";

interface CategoryDoc {
    name: String;
    slug: String;

    aliases?: String[];
    createdAt?: Date;
    updatedAt?: Date;
}

const CategorySchema = new Schema<CategoryDoc> (
    {
        name: {type: String, required: true, trim: true},
        slug: {type: String, required: true, trim: true},
        aliases: {type: [String], default: []},
        
    }, {timestamps: true}
);

export default models.Category || model('Category', CategorySchema );