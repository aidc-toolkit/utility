import { i18nAssertValidResources, i18nCoreInit, type I18NEnvironment } from "@aidc-toolkit/core";
import i18next, { type Resource } from "i18next";
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

export const i18nextUtility = i18next.createInstance();

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
export async function i18nUtilityInit(environment: I18NEnvironment, debug = false): Promise<void> {
    await i18nCoreInit(i18nextUtility, environment, debug, utilityNS, utilityResources);
}
