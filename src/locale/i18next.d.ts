import type { UtilityLocaleResources } from "./i18n";

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
            aidct_utility: UtilityLocaleResources;
        };
    }
}
