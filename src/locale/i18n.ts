import { i18nCoreInit, type I18nEnvironment } from "@aidc-toolkit/core";
import i18next, { type i18n, type Resource } from "i18next";
import enLocaleResources from "./en/locale-resources";
import frLocaleResources from "./fr/locale-resources";

export const utilityNS = "aidct_utility";

/**
 * Locale strings type is extracted from the English locale strings object.
 */
export type UtilityLocaleResources = typeof enLocaleResources;

/**
 * Utility resources.
 */
export const utilityResources: Resource = {
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
