import { db } from "./Database.js";

export interface Profile {
  userIdentifier: string;
  textures: string[] | undefined;        // undefined = never saved
  name: string | undefined;
  companion: string | null | undefined;  // null = explicitly cleared, undefined = never decided
  updatedAt: string;
}

/**
 * Reads and writes the per-user profile. Rows are global to the user, not per world:
 * `playUri` is deliberately not part of the key, because the point of this service is that
 * a Woka follows its owner everywhere.
 */
export class ProfileRepository {
  /**
   * Returns the stored profile, or `undefined` when this user has never saved anything.
   * A corrupted `textures` column is treated as "never saved" rather than throwing, so a
   * bad row cannot lock its owner out of the game.
   */
  get(userIdentifier: string): Profile | undefined {
    const stmt = db.prepare(`SELECT * FROM profiles WHERE user_identifier = ?`);
    const row = stmt.get(userIdentifier) as Record<string, unknown> | undefined;
    if (!row) {
      return undefined;
    }
    
    let textures: string[] | undefined = undefined;
    if (typeof row.textures === "string") {
      try {
        const parsed = JSON.parse(row.textures);
        if (Array.isArray(parsed) && parsed.every(t => typeof t === "string")) {
          textures = parsed;
        }
      } catch {
        // ignore
      }
    }
    
    let companion: string | null | undefined = undefined;
    if (row.companion_set === 1) {
      companion = typeof row.companion === "string" ? row.companion : null;
    }
    
    return {
      userIdentifier: row.user_identifier as string,
      textures,
      name: typeof row.name === "string" ? row.name : undefined,
      companion,
      updatedAt: row.updated_at as string
    };
  }
  
  /** Upserts the Woka textures, leaving the name and companion columns untouched. */
  saveTextures(userIdentifier: string, textures: string[]): void {
    const stmt = db.prepare(`
      INSERT INTO profiles (user_identifier, textures, updated_at) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_identifier) DO UPDATE SET textures=excluded.textures, updated_at=excluded.updated_at
    `);
    stmt.run(userIdentifier, JSON.stringify(textures), new Date().toISOString());
  }

  /** Upserts the display name, leaving the textures and companion columns untouched. */
  saveName(userIdentifier: string, name: string): void {
    const stmt = db.prepare(`
      INSERT INTO profiles (user_identifier, name, updated_at) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_identifier) DO UPDATE SET name=excluded.name, updated_at=excluded.updated_at
    `);
    stmt.run(userIdentifier, name, new Date().toISOString());
  }

  /**
   * Upserts the companion. `null` means "the user explicitly removed it", which is why
   * `companion_set` is always set to 1: it is what distinguishes a cleared companion from
   * one that was never chosen, and stops a removed companion from coming back on the next
   * login.
   */
  saveCompanion(userIdentifier: string, companion: string | null): void {
    const stmt = db.prepare(`
      INSERT INTO profiles (user_identifier, companion, companion_set, updated_at) 
      VALUES (?, ?, 1, ?) 
      ON CONFLICT(user_identifier) DO UPDATE SET companion=excluded.companion, companion_set=1, updated_at=excluded.updated_at
    `);
    stmt.run(userIdentifier, companion, new Date().toISOString());
  }
}

export const repo = new ProfileRepository();
