/**
 * Provides typed database helpers for retrieving category records.
 */
import { asc } from 'drizzle-orm';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';
import type { Database } from './db';

/**
 * Retrieves all categories in alphabetical order by name.
 *
 * @param db - The database connection used to query categories.
 * @returns A promise resolving to the ordered category records.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name));
}
