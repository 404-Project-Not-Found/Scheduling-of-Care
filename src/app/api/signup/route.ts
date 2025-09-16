import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

// Defines valid user roles
const ROLES = ["carer", "management", "family"] as const;

export async function POST(req: NextRequest){
    try{
        // Extract data from request body
        const{fullName, email, password, confirm, role} = await req.json();

        // Validate required fields
        if(!fullName || !email || !password || !confirm || !role){
            return NextResponse.json({error: "Missing fields"}, {status: 400});
        }

        if(password !== confirm){
            return NextResponse.json({error: "Passwords do not match"}, {status: 400});
        }
        
        // Validate role against allowed roles
        if(!ROLES.includes(role)){
            return NextResponse.json({error: "Invalid role"}, {status: 400});
        }

        // Connect to MongoDB
        const client = await clientPromise;
        const db = client.db("schedule-of-care");
        const usersCollection = db.collection("users");

        // Check if a user already exists under the email
        const userExists = await usersCollection.findOne({email});
        if(userExists){
            return NextResponse.json({error: "User already exists"}, {status: 409}); // Conflict status
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user info into the database
        const newUser = await usersCollection.insertOne({
            fullName, email, password: hashedPassword, role, createdAt: new Date()
        });

        // Success response with new user ID
        return NextResponse.json({message: "New user created", userId: newUser.insertedId});
    }
    catch(error){
        console.error(error);
        // Generic server error response
        return NextResponse.json({error: "Internal server error"}, {status: 500});
    }
}