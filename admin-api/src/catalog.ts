import fs from "node:fs";
import path from "node:path";
import { WOKA_DATA_DIR } from "./env.js";
import { wokaList, type WokaList, type WokaDetail } from "@workadventure/messages/src/JsonMessages/PlayerTextures";
import { CompanionTextureCollection, type CompanionDetail } from "@workadventure/messages/src/JsonMessages/CompanionTextures";
import { z } from "zod";

let cachedWokaList: WokaList;
let cachedCompanionList: z.infer<typeof CompanionTextureCollection>[];
// The list endpoints serve the untouched file contents: zod strips unknown keys
// (e.g. `position`), and we want the catalog to be a faithful passthrough.
let rawWokaList: unknown;
let rawCompanionList: unknown;

export function loadCatalog() {
  const wokaPath = path.join(WOKA_DATA_DIR, "woka.json");
  const companionsPath = path.join(WOKA_DATA_DIR, "companions.json");
  if (!fs.existsSync(wokaPath)) {
    throw new Error(`Catalog file not found: ${wokaPath}`);
  }
  if (!fs.existsSync(companionsPath)) {
    throw new Error(`Catalog file not found: ${companionsPath}`);
  }
  rawWokaList = JSON.parse(fs.readFileSync(wokaPath, "utf-8"));
  cachedWokaList = wokaList.parse(rawWokaList);
  rawCompanionList = JSON.parse(fs.readFileSync(companionsPath, "utf-8"));
  cachedCompanionList = z.array(CompanionTextureCollection).parse(rawCompanionList);
}

export function getWokaList(): unknown {
  return rawWokaList;
}

export function getCompanionList(): unknown {
  return rawCompanionList;
}

const wokaPartNames = ["woka", "body", "eyes", "hair", "clothes", "hat", "accessory"];

export function resolveWoka(ids: string[]): WokaDetail[] | undefined {
  const textures = new Map<string, string>();
  const searchIds = new Set(ids);

  for (const part of wokaPartNames) {
    const wokaPartType = cachedWokaList[part as keyof WokaList];
    if (!wokaPartType || typeof wokaPartType === "boolean") {
      continue;
    }

    for (const collection of wokaPartType.collections) {
      for (const id of Array.from(searchIds)) {
        const texture = collection.textures.find((texture) => texture.id === id);

        if (texture) {
          textures.set(id, texture.url);
          searchIds.delete(id);
        }
      }
    }
  }

  if (ids.length !== textures.size) {
    return undefined;
  }

  const details: WokaDetail[] = [];

  textures.forEach((value, key) => {
    details.push({
      id: key,
      url: value,
    });
  });

  return details;
}

export function resolveCompanion(id: string): CompanionDetail | undefined {
  for (const collection of cachedCompanionList) {
    const texture = collection.textures.find((texture) => texture.id === id);

    if (texture) {
      return {
        id: texture.id,
        url: texture.url,
      };
    }
  }

  return undefined;
}
