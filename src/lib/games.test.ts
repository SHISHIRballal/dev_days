import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

interface FilterFixtures {
    strategyId: number;
    puzzleId: number;
    firstPublisherId: number;
    secondPublisherId: number;
}

async function seedFilterFixtures(db: Database): Promise<FilterFixtures> {
    const [strategy] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'strategy games' })
        .returning({ id: categories.id });
    const [puzzle] = await db
        .insert(categories)
        .values({ name: 'Puzzle', description: 'puzzle games' })
        .returning({ id: categories.id });
    const [firstPublisher] = await db
        .insert(publishers)
        .values({ name: 'Alpha Studio', description: 'first publisher' })
        .returning({ id: publishers.id });
    const [secondPublisher] = await db
        .insert(publishers)
        .values({ name: 'Beta Studio', description: 'second publisher' })
        .returning({ id: publishers.id });

    await db.insert(games).values([
        {
            title: 'Alpha Puzzle',
            description: 'Puzzle game',
            starRating: 4.1,
            categoryId: puzzle.id,
            publisherId: firstPublisher.id,
        },
        {
            title: 'Alpha Strategy',
            description: 'Strategy game',
            starRating: 4.2,
            categoryId: strategy.id,
            publisherId: firstPublisher.id,
        },
        {
            title: 'Beta Strategy',
            description: 'Strategy game',
            starRating: 4.3,
            categoryId: strategy.id,
            publisherId: secondPublisher.id,
        },
    ]);

    return {
        strategyId: strategy.id,
        puzzleId: puzzle.id,
        firstPublisherId: firstPublisher.id,
        secondPublisherId: secondPublisher.id,
    };
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('filters games by one or more categories', async () => {
        const fixtures = await seedFilterFixtures(db);
        const filtered = await getAllGames(db, { categoryIds: [fixtures.puzzleId] });

        expect(filtered.map((game) => game.title)).toEqual(['Alpha Puzzle']);
    });

    it('filters games by publisher', async () => {
        const fixtures = await seedFilterFixtures(db);
        const filtered = await getAllGames(db, { publisherId: fixtures.secondPublisherId });

        expect(filtered.map((game) => game.title)).toEqual(['Beta Strategy']);
    });

    it('combines category and publisher filters', async () => {
        const fixtures = await seedFilterFixtures(db);
        const filtered = await getAllGames(db, {
            categoryIds: [fixtures.strategyId],
            publisherId: fixtures.firstPublisherId,
        });

        expect(filtered.map((game) => game.title)).toEqual(['Alpha Strategy']);
    });

    it('returns no games when filters do not match', async () => {
        await seedFilterFixtures(db);
        const filtered = await getAllGames(db, { categoryIds: [99999] });

        expect(filtered).toEqual([]);
    });
});
