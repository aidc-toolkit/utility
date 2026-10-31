import { i18nCoreInit, i18nInit } from "@aidc-toolkit/core";
import type { i18n, ParseKeys, Resource, TFunction } from "i18next";
import enLocaleResources from "./en/locale-resources.js";
import frLocaleResources from "./fr/locale-resources.js";

/**
 * Utility namespace.
 */
export const utilityNS = "aidct_utility";

/**
 * Utility parse keys.
 */
export type UtilityParseKeys = ParseKeys<typeof utilityNS>;

/**
 * Locale resources type is extracted from the English locale resources object.
 */
export type UtilityLocaleResources = typeof enLocaleResources;

/**
 * Utility resource bundle.
 */
export const utilityResourceBundle: Resource = {
    en: {
        aidct_utility: enLocaleResources
    },
    fr: {
        aidct_utility: frLocaleResources
    }
};

/**
 * Utility i18next translator function.
 */
export let i18nextUtilityT: TFunction<typeof utilityNS>;

/**
 * Initialize internationalization.
 *
 * @param i18next
 * Internationalization instance.
 *
 * @param debug
 * Debug setting.
 *
 * @returns
 * Utility resource bundle.
 */
export async function i18nUtilityInit(i18next: i18n, debug = false): Promise<Resource> {
    // Bind translator function to i18next.
    i18nextUtilityT = i18next.getFixedT(null, utilityNS);

    return i18nInit(i18next, debug, utilityResourceBundle, i18nCoreInit);
}
