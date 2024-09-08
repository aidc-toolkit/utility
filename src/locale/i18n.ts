import { i18nAddResourceBundle, i18next } from "@aidc-toolkit/core";
import { localeStrings as enLocaleStrings } from "./en/locale_strings.js";

export const utilityNS = "aidct_utility";

i18nAddResourceBundle("en", utilityNS, enLocaleStrings);

export default i18next;
