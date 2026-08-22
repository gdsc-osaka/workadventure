import fs from "node:fs";
import path from "node:path";
import { wokaList, type WokaList, type WokaDetail } from "@workadventure/messages/src/JsonMessages/PlayerTextures";
import {
    CompanionTextureCollection,
    type CompanionDetail,
} from "@workadventure/messages/src/JsonMessages/CompanionTextures";
import { z } from "zod";
import { WOKA_DATA_DIR } from "./env.js";

let cachedWokaList: WokaList;
let cachedCompanionList: z.infer<typeof CompanionTextureCollection>[];
// The list endpoints serve the untouched file contents: zod strips unknown keys
// (e.g. `position`), and we want the catalog to be a faithful passthrough.
let rawWokaList: unknown;
let rawCompanionList: unknown;

/**
 * Reads `woka.json` / `companions.json` once at boot. Throws if either file is missing or
 * invalid, so a misconfigured `WOKA_DATA_DIR` fails immediately instead of serving an
 * empty catalog that would send every user back to the Woka picker.
 */
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

/** The raw `woka.json` contents, served verbatim by `GET /api/woka/list`. */
export function getWokaList(): unknown {
    return rawWokaList;
}

/** The raw `companions.json` contents, served verbatim by `GET /api/companion/list`. */
export function getCompanionList(): unknown {
    return rawCompanionList;
}

const wokaPartNames = ["woka", "body", "eyes", "hair", "clothes", "hat", "accessory"];

/**
 * Resolves texture ids to `{id, url}` pairs, mirroring the upstream algorithm in
 * `play`'s WokaService. Returns `undefined` when any id is unknown - including the case
 * where the same id is passed twice, because the ids are de-duplicated into a Map and the
 * size check then fails. That matches upstream, and pusher reads `undefined` as
 * "textures are not valid", which sends the user to the Woka picker.
 */
export function resolveWoka(ids: string[]): WokaDetail[] | undefined {
    const textures = new Map<string, string>();
    const searchIds = new Set(ids);

    for (const part of wokaPartNames) {
        const wokaPartType = cachedWokaList[part];
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

/** Resolves a companion id to `{id, url}`, or `undefined` when it is not in the catalog. */
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
