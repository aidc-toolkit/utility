import type { CoreLocaleResources } from "@aidc-toolkit/core";
import type { UtilityLocaleResources } from "./i18n.js";

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
            aidct_core: CoreLocaleResources;
            aidct_utility: UtilityLocaleResources;
        };
    }
}
