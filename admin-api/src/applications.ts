import type { ApplicationDefinitionInterface } from "@workadventure/messages/src/JsonMessages/ApplicationDefinitionInterface";
import {
    CARDS_ENABLED,
    ERASER_ENABLED,
    EXCALIDRAW_ENABLED,
    GOOGLE_DOCS_ENABLED,
    GOOGLE_DRIVE_ENABLED,
    GOOGLE_SHEETS_ENABLED,
    GOOGLE_SLIDES_ENABLED,
    KLAXOON_ENABLED,
    TLDRAW_ENABLED,
    YOUTUBE_ENABLED,
} from "./env.js";

/**
 * Port of the `applications` list `LocalAdmin.fetchMemberDataByUuid()` builds
 * (LocalAdmin.ts). Setting ADMIN_API_URL bypasses LocalAdmin entirely and this
 * list is what ends up in RoomJoinedMessage.applications, so returning an empty
 * array here would silently remove the whole "Applications" menu (Google Docs,
 * Excalidraw, tldraw, ...) from a self-hosted install.
 *
 * Keep the env variable names identical to play's, so the same `.env` drives both.
 */
const APPLICATIONS: { enabled: boolean; application: ApplicationDefinitionInterface }[] = [
    {
        enabled: KLAXOON_ENABLED,
        application: {
            name: "Klaxoon",
            doc: "https://klaxoon.com",
            image: "https://static.klaxoon.com/favicon.ico",
            description: "Klaxoon (Brainstorming, Quiz, Survey)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: YOUTUBE_ENABLED,
        application: {
            name: "Youtube",
            doc: "https://youtube.com",
            image: "https://www.youtube.com/favicon.ico",
            description: "Youtube (Video sharing)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: GOOGLE_DRIVE_ENABLED,
        application: {
            name: "Google Drive",
            doc: "https://drive.google.com",
            description: "Google Drive (Docs, Sheets, Slides)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: GOOGLE_DOCS_ENABLED,
        application: {
            name: "Google Docs",
            doc: "https://docs.google.com",
            description: "Google Docs (Word Processor)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: GOOGLE_SHEETS_ENABLED,
        application: {
            name: "Google Sheets",
            doc: "https://sheets.google.com",
            description: "Google Sheets (Spreadsheet)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: GOOGLE_SLIDES_ENABLED,
        application: {
            name: "Google Slides",
            doc: "https://slides.google.com",
            description: "Google Slides (Presentation)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: ERASER_ENABLED,
        application: {
            name: "Eraser",
            doc: "https://workadventu.re",
            description: "Eraser (White board)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: EXCALIDRAW_ENABLED,
        application: {
            name: "Excalidraw",
            doc: "https://excalidraw.com",
            description: "Excalidraw (White board)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: CARDS_ENABLED,
        application: {
            name: "Cards",
            doc: "https://workadventu.re",
            description: "Cards (learning tool)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
    {
        enabled: TLDRAW_ENABLED,
        application: {
            name: "tldraw",
            doc: "https://tldraw.com",
            description: "tldraw (White board)",
            enabled: true,
            default: true,
            forceNewTab: false,
            allowAPI: false,
        },
    },
];

/** The applications enabled by the current environment, in `LocalAdmin`'s order. */
export function getApplications(): ApplicationDefinitionInterface[] {
    return APPLICATIONS.filter((entry) => entry.enabled).map((entry) => entry.application);
}
