import { i18nCoreInit, type I18nEnvironment, i18nInit } from "@aidc-toolkit/core";
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
 * @param environment
 * Environment in which the application is running.
 *
 * @param debug
 * Debug setting.
 *
 * @returns
 * Utility resource bundle.
 */
export async function i18nUtilityInit(environment: I18nEnvironment, debug = false): Promise<Resource> {
    return i18nInit(i18nextUtility, environment, debug, utilityNS, utilityResourceBundle, i18nCoreInit);
}
