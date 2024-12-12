import type { UtilityLocaleStrings } from "./i18n.js";

/**
 * Internationalization module.
 */
declare module "i18next" {
    /**
     * Custom type options for this package.
     */
    interface CustomTypeOptions {
        defaultNS: "aidct_utility";
        resources: {
            aidct_utility: UtilityLocaleStrings;
        };
    }
}
