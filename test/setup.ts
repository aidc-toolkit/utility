import { DEFAULT_LANGUAGE, i18nextInstance, I18nLanguageDetectors } from "@aidc-toolkit/core";
import { i18nUtilityInit } from "../src/index.js";

await i18nUtilityInit(I18nLanguageDetectors.CLI).then(async () => i18nextInstance.changeLanguage(DEFAULT_LANGUAGE));
