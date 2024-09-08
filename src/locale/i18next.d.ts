import type { localeStrings } from "./en/locale_strings.js";

declare module "i18next" {
    interface CustomTypeOptions {
        resources: {
            // Extract the type from the English locale strings object.
            aidct_utility: typeof localeStrings;
        };
    }
}
