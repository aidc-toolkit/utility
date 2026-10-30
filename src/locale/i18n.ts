import { i18nCoreInit, i18nInit, type I18nLanguageDetector } from "@aidc-toolkit/core";
import i18next, { type i18n, type Resource } from "i18next";
import enLocaleResources from "./en/locale-resources.js";
import frLocaleResources from "./fr/locale-resources.js";

export const utilityNS = "aidct_utility";

/**
 * Locale strings type is extracted from the English locale strings object.
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

// Explicit type is necessary because type can't be inferred without additional references.
export const i18nextUtility: i18n = i18next.createInstance();

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
    return i18nInit(i18nextUtility, languageDetector, debug, utilityNS, utilityResourceBundle, i18nCoreInit);
}
