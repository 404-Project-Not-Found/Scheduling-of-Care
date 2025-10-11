/**
 * Filename: /lib/component_helpers.ts
 * Author: Zahra Rizqita
 * Date Created: 03/10/2025
 */

import Category from "@/models/Category";
import {Types} from 'mongoose';
import {slugify} from "./slug";


// Function to find existing category if input is similar or create a new category if not found
export async function findOrCreateNewCategory(params: {clientId: Types.ObjectId; input: string}) {
    const {clientId, input} = params;  
    const name = input.trim();
    if(!name) throw new Error("Category name required");

    const baseSlug = slugify(name);

    const doc = await Category.findOneAndUpdate(
        {clientId, baseSlug},
        {$setOnInsert: {name: name, clientId},},
        {new: true, upsert: true}
    );

    return doc;
    // Find existing category

    /*
    const exist = await Category.findOne({
        $or: [
            {slug: baseSlug},
            {name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")},
            {aliases:new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")},
        ]
    });
    
    if(exist) {
        const lowerName = name.toLowerCase();
        const lowerExistName = exist.name.toLowerCase();
        const aliasLower = (exist.aliases ?? []).map((alias: string) => alias.toLowerCase());

        if(lowerName !== lowerExistName && !aliasLower.includes(lowerName)) {
            await Category.updateOne(
                {_id: exist._id},
                {$addToSet: {aliases: name}}
            );
        }

        return exist.toObject();
    }

    const newCategory = await Category.create({
        name,
        slug: baseSlug,
        aliases: [name],
    });

    
    return newCategory.toObject();
    */
}