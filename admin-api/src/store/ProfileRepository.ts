import { db } from "./Database.js";

export interface Profile {
  userIdentifier: string;
  textures: string[] | undefined;        // undefined = never saved
  name: string | undefined;
  companion: string | null | undefined;  // null = explicitly cleared, undefined = never decided
  updatedAt: string;
}

export class ProfileRepository {
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
  
  saveTextures(userIdentifier: string, textures: string[]): void {
    const stmt = db.prepare(`
      INSERT INTO profiles (user_identifier, textures, updated_at) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_identifier) DO UPDATE SET textures=excluded.textures, updated_at=excluded.updated_at
    `);
    stmt.run(userIdentifier, JSON.stringify(textures), new Date().toISOString());
  }

  saveName(userIdentifier: string, name: string): void {
    const stmt = db.prepare(`
      INSERT INTO profiles (user_identifier, name, updated_at) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_identifier) DO UPDATE SET name=excluded.name, updated_at=excluded.updated_at
    `);
    stmt.run(userIdentifier, name, new Date().toISOString());
  }

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
