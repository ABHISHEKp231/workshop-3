/**
 * Publisher data-access helpers for the Tailspin Toys Crowd Funding platform.
 * Provides functions to retrieve publisher information from the database.
 */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';

/**
 * Returns a list of all publishers with their id and name.
 *
 * @param db - The Drizzle database client.
 * @returns A promise that resolves to an array of publisher objects.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));
}
