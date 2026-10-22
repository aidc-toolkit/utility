import { i18nCoreInit, i18nextInstance, i18nInit, type I18nLanguageDetector } from "@aidc-toolkit/core";
import type { ParseKeys, Resource } from "i18next";
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
 * Locale resources type is extracted from the English locale strings object.
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
export const i18nextUtilityT = i18nextInstance.getFixedT(null, utilityNS);

/**
 * Initialize internationalization.
 *
 * @param languageDetector
 * Language detector.
 *
 * @param debug
 * Debug setting.
 *
 * @returns
 * Utility resource bundle.
 */
export async function i18nUtilityInit(languageDetector: I18nLanguageDetector, debug = false): Promise<Resource> {
    return i18nInit(languageDetector, debug, utilityResourceBundle, i18nCoreInit);
}
