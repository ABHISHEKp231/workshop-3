import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getFilteredGames,
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

    it('filters games by category and publisher together', async () => {
        const [strategy] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'strategy' })
            .returning({ id: categories.id });
        const [puzzle] = await db
            .insert(categories)
            .values({ name: 'Puzzle', description: 'puzzle' })
            .returning({ id: categories.id });
        const [codeForge] = await db
            .insert(publishers)
            .values({ name: 'CodeForge Studios', description: 'code' })
            .returning({ id: publishers.id });
        const [devMasters] = await db
            .insert(publishers)
            .values({ name: 'DevMasters Inc.', description: 'dev' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            { title: 'Code Strategy', description: 'game', starRating: 4, categoryId: strategy.id, publisherId: codeForge.id },
            { title: 'Dev Strategy', description: 'game', starRating: 4, categoryId: strategy.id, publisherId: devMasters.id },
            { title: 'Code Puzzle', description: 'game', starRating: 4, categoryId: puzzle.id, publisherId: codeForge.id },
        ]);

        const categoryGames = await getFilteredGames(db, { categoryIds: [strategy.id] });
        expect(categoryGames.map((game) => game.title)).toEqual(['Code Strategy', 'Dev Strategy']);

        const publisherGames = await getFilteredGames(db, { publisherId: codeForge.id });
        expect(publisherGames.map((game) => game.title)).toEqual(['Code Puzzle', 'Code Strategy']);

        const combinedGames = await getFilteredGames(db, {
            categoryIds: [strategy.id],
            publisherId: codeForge.id,
        });
        expect(combinedGames.map((game) => game.title)).toEqual(['Code Strategy']);
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
});
