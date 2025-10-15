/**
 * Filename: /app/api/care-item/[slug]/done/route.ts
 * Author: Zahra Rizqita
 * Date Created: 15/10/2025
 * 
 * Handle api for carer to add comment, upload a file and marking a task as done
 */

import {NextResponse} from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CareItem from '@/models/CareItem';

interface DoneTaskBody {
    doneAt: string;
    comment?: string; // Optional
    file: string;
}

type CareItemLean = {
    slug: string;
    status?: string;
    comments?: string[];
    files?: string[];
    doneDate?: string[];
};

function returnError(str: string, status: number) {
    return NextResponse.json({error: str}, {status: status});
}
/**
 * Update the care item for comments, files and when the task was last done
 */
export async function POST(req: Request, {params}: {params: {slug: string}}) {
    await connectDB();
    const {slug} = params;

    let body: DoneTaskBody;
    try {
        body = (await req.json()) as DoneTaskBody;
    } catch {
        return NextResponse.json({error: 'Invalid JSON'}, {status: 400});
    }
    
    const fileName = (body.file ?? '').trim();
    const comment = (body.comment ?? '').trim();
    const doneAt = (body.doneAt ?? '').trim();

    if(!fileName) returnError('A file must be provided to mark this care item as done', 422);
    if(!doneAt) returnError('Must note when this care item is marked as done', 422);

    const exist = await CareItem.findOne({slug}).lean<CareItemLean | null>();

    const setStatus = {status: 'Pending' as const};
    const pushDone: Partial<Record<'files' | 'comments' | 'doneDates', string>> = { files: fileName, doneDates: doneAt};

    if(comment) pushDone.comments = comment;

    const update =
        Object.keys(pushDone).length > 0
        ? {$set: setStatus, $push: pushDone}
        : {$set: setStatus};
    
    const updated = await CareItem.findOneAndUpdate(
        {slug},
        update,
        {new: true}
    ).select('slug status comments files doneDates').lean<CareItemLean | null>();

    if(!updated) return returnError('Care item not found', 404);

    return NextResponse.json({
        slug: updated.slug,
        status: updated.status,
        comments: Array.isArray(updated.comments) ? updated.comments : [],
        files: Array.isArray(updated.files) ? updated.files : [],
        doneDates: Array.isArray(updated.doneDate) ? updated.doneDate : [],
    }); 
}