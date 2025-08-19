import { i18nAssertValidResources, i18nCoreInit, type I18nEnvironment } from "@aidc-toolkit/core";
import i18next, { type i18n, type Resource } from "i18next";
import { localeStrings as enLocaleStrings } from "./en/locale-strings.js";
import { localeStrings as frLocaleStrings } from "./fr/locale-strings.js";

export const utilityNS = "aidct_utility";

/**
 * Locale strings type is extracted from the English locale strings object.
 */
export type UtilityLocaleStrings = typeof enLocaleStrings;

i18nAssertValidResources(enLocaleStrings, "fr", frLocaleStrings);

/**
 * Utility resources.
 */
export const utilityResources: Resource = {
    en: {
        aidct_utility: enLocaleStrings
    },
    fr: {
        aidct_utility: frLocaleStrings
    }
};

// Explicit type is necessary to work around bug in type discovery with linked packages.
export const i18nextUtility: i18n = i18next.createInstance();

/**
 * Initialize internationalization.
 *
 * @param environment
 * Environment in which the application is running.
 *
 * @param debug
 * Debug setting.
 *
 * @returns
 * Void promise.
 */
export async function i18nUtilityInit(environment: I18nEnvironment, debug = false): Promise<void> {
    await i18nCoreInit(i18nextUtility, environment, debug, utilityNS, utilityResources);
}
