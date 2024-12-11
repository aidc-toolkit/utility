import type { localeStrings } from "./en/locale-strings.js";

/**
 * Internationalization module.
 */
declare module "i18next" {
    /**
     * Custom type options for this package.
     */
    interface CustomTypeOptions {
        resources: {
            // Extract the type from the English locale strings object.
            aidct_utility: typeof localeStrings;
        };
    }
}
