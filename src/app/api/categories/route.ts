import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, handleError } from '@/lib/api-response';

interface CategoryTree {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  sortOrder: number;
  children: CategoryTree[];
}

function buildCategoryTree(
  categories: {
    id: string;
    name: string;
    nameAr: string | null;
    slug: string;
    sortOrder: number;
    parentId: string | null;
  }[],
  parentId: string | null = null
): CategoryTree[] {
  return categories
    .filter((cat) => cat.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr,
      slug: cat.slug,
      sortOrder: cat.sortOrder,
      children: buildCategoryTree(categories, cat.id),
    }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true';
    
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        sortOrder: true,
        parentId: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    
    if (flat) {
      return success(categories);
    }
    
    const tree = buildCategoryTree(categories);
    return success(tree);
  } catch (err) {
    return handleError(err);
  }
}
