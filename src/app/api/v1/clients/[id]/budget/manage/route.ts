/**
 * Filename: /app/api/v1/clients/[id]/budget/manage/route.ts
 * Author: Zahra Rizqita
 * Date Created: 10/10/2025
 *
 * Handle api for budget, allocate or release budget, set annual, set category, set item, release category/item - what management does in budget report
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { BudgetYear, type BudgetYearHydrated, type CategoryBudget } from "@/models/Budget";
import { Types } from 'mongoose';
import { getViewerRole } from "@/lib/data";
import { publishBudgetChange } from "@/lib/sse-bus";

type Action = 
  | 'setAnnual'
  | 'setCategory'
  | 'setItem'
  | 'releaseCategory'
  | 'releaseItem';

interface SetAnnualBody {
  action: 'setAnnual';
  year: number;
  amount: number;
}

interface SetCategoryBody {
  action: 'setCategory'
  year: number;
  categoryId: Types.ObjectId,
  categoryName?: string;
  amount: number;
}

interface SetItemBody {
  action: 'setItem';
  year: number;
  categoryId: string;
  careItemSlug: string;
  label?: string;
  amount: number;
}

interface ReleaseCategoryBody {
  action: 'releaseCategory';
  year: number;
  categoryId: string;
}

interface ReleaseItemBody {
  action: 'releaseItem';
  year: number;
  categoryId: string;
  careItemSlug: string;
}

type ManageBody = 
  | SetAnnualBody
  | SetCategoryBody
  | SetItemBody
  | ReleaseCategoryBody
  | ReleaseItemBody;

function recomputeTotals(doc: BudgetYearHydrated) {
  const categories: CategoryBudget[] = doc.categories;
  doc.totals.allocated = categories.reduce((sum: number, c: CategoryBudget) => sum + (c.allocated ?? 0), 0);
  const annual = doc.annualAllocated ?? 0;
  const allocated = doc.totals.allocated ?? 0;
  doc.surplus = Math.max(0, annual - allocated);
}

export async function PATCH(
  req: Request,
  {params} : {params: Promise<{id: string}>}
) {
  const {id} = await params;
  await connectDB();
  const role = await getViewerRole();
  const body: ManageBody = await req.json();
  const currYear = new Date().getFullYear();
  if(body.year < currYear) {
    return NextResponse.json(
      {error: 'Past year is read-only'}, 
      {status: 409}
    );
  }

  let clientId: Types.ObjectId;
  try{
    clientId = new Types.ObjectId(id);
  } catch{
    return NextResponse.json({error: 'Invalid ClientId'}, {status: 422});
  }

  let doc = await BudgetYear.findOne({clientId, year: body.year}); 
  // Create new if not found
  if(!doc) { 
    doc = await BudgetYear.create({
      clientId,
      year: body.year,
      annualAllocated: 0,
      categories: [],
      surplus: 0,
      totals: {spent: 0, allocated: 0}
    });
  }

  switch(body.action) {
    case 'setAnnual': {
      doc.annualAllocated = Math.max(0, body.amount);
      recomputeTotals(doc);
      break;
    }
    case 'setCategory': {
      const catId = new Types.ObjectId(body.categoryId);
      const categories = doc.categories as CategoryBudget[];
      const existing = categories.find((c) => String(c.categoryId) === String(catId));
      if(!existing) {
        categories.push({
          categoryId: catId,
          categoryName: body.categoryName ?? 'Category',
          allocated: Math.max(0, body.amount),
          items: [],
          spent: 0,
        });
      }
      else {
        existing.categoryName = body.categoryName ?? existing.categoryName;
        existing.allocated = Math.max(0, body.amount);

        const itemsTotal = existing.items.reduce((sum: number, i) => sum + i.allocated, 0);
        if(itemsTotal > existing.allocated && itemsTotal > 0) {
          const factor = existing.allocated / itemsTotal;
          existing.items.forEach((i) => (i.allocated = Math.floor(i.allocated*factor)));
        }
      }
      recomputeTotals(doc);
      break;
    }
    case 'setItem': {
      const catId = new Types.ObjectId(body.categoryId);
      const categories = doc.categories as CategoryBudget[];
      const cat = categories.find((c) => String(c.categoryId) === String(catId));
      if (!cat) { return NextResponse.json({ error: 'Category not found' }, { status: 404 }); }
      const slug = body.careItemSlug.toLowerCase();

      const existing = cat.items.find((i) => i.careItemSlug === slug);
      if(!existing) {
        cat.items.push({
          careItemSlug: slug,
          label: body.label ?? slug,
          allocated: Math.max(0, body.amount),
          spent: 0,
        });
      } 
      else {
        existing.label = body.label ?? existing.label;
        existing.allocated = Math.max(0, body.amount);
      }

      const totalItems = cat.items.reduce((sum: number, i) => sum + i.allocated, 0);
      if(totalItems > cat.allocated) {
        return NextResponse.json({error: 'Care Items exceed category allocation'}, {status: 422});
      }

      recomputeTotals(doc);
      break;
    }
    case 'releaseCategory': {
      const catId = new Types.ObjectId(body.categoryId);
      const categories = doc.categories as CategoryBudget[];
      const cat = categories.find((c) => String(c.categoryId) === String(catId));
      if (!cat) { return NextResponse.json({ error: 'Category not found' }, { status: 404 }); }
      cat.allocated = 0;
      cat.items.forEach((i) => (i.allocated = 0));
      cat.releasedAt = new Date();
      recomputeTotals(doc);
      break;
    }
    case 'releaseItem': {
      const catId = new Types.ObjectId(body.categoryId);
      const categories = doc.categories as CategoryBudget[];
      const cat = categories.find((c) => String(c.categoryId) === String(catId));
      if (!cat) { return NextResponse.json({ error: 'Category not found' }, { status: 404 }); }

      const slug = body.careItemSlug.toLowerCase();
      const item = cat.items.find((i) => i.careItemSlug === slug);
      if(!item) {return NextResponse.json({ error: 'Care Item not found' }, { status: 404 });}
      item.allocated = 0;
      item.releasedAt = new Date();
      recomputeTotals(doc);
      
      break;
    }
    default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  doc.markModified('categories');
  await doc.save();
  publishBudgetChange(id, body.year);
  const totalAllocated = doc.totals.allocated ?? 0; 
  const totalSpent = doc.totals.spent ?? 0;
  return NextResponse.json({
    ok: true,
    annualAllocated: doc.annualAllocated ?? 0,
    spent: totalSpent,
    remaining: Math.max(0, (doc.annualAllocated ?? 0) - totalSpent),
    surplus: Math.max(0, (doc.annualAllocated ?? 0) - totalAllocated),
  });
}




