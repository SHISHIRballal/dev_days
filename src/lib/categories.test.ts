import { describe, expect, it } from 'vitest';
import { categories } from '../../db/schema';
import { createTestDatabase } from '../../db/test-helpers';
import { getAllCategories } from './categories';

describe('category data-access helpers', () => {
    it('returns categories ordered by name', async () => {
        const db = await createTestDatabase();
        await db.insert(categories).values([
            { name: 'Strategy', description: 'strategy games' },
            { name: 'Puzzle', description: 'puzzle games' },
        ]);

        const result = await getAllCategories(db);

        expect(result.map((category) => category.name)).toEqual(['Puzzle', 'Strategy']);
    });

    it('returns an empty list when there are no categories', async () => {
        const db = await createTestDatabase();

        await expect(getAllCategories(db)).resolves.toEqual([]);
    });
});
