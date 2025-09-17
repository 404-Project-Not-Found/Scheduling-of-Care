/**
 * 
 */

import {getDb} from "@/lib/mongodb";
import {Role} from "@/lib/roles";

export type User = {
    _id: String;
    email: String;
    role: Role;
}

export async function findUserByEmail(email: String) {
    const db = await getDb();
    return db.collection<User>("users").findOne( { email } );
}

export async function upsertUser(user: User) {
    const db = await getDb();
    await db.collection<User>("users").updateOne(
        { id: user._id },
        { $set: user },
        { upsert: true }
    );
    return user;
}


