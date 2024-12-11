import { i18nAddResourceBundle, i18nAssertValidResources, i18next } from "@aidc-toolkit/core";
import { localeStrings as enLocaleStrings } from "./en/locale-strings.js";
import { localeStrings as frLocaleStrings } from "./fr/locale-strings.js";

export const utilityNS = "aidct_utility";

i18nAssertValidResources(enLocaleStrings, "fr", frLocaleStrings);

i18nAddResourceBundle("en", utilityNS, enLocaleStrings);
i18nAddResourceBundle("fr", utilityNS, frLocaleStrings);

export default i18next;
