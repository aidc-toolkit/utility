import { DEFAULT_LANGUAGE, i18nCoreCLILanguageDetector } from "@aidc-toolkit/core";
import i18next from "i18next";
import { i18nUtilityInit } from "../src/index.js";

await i18nUtilityInit(i18next.use(i18nCoreCLILanguageDetector)).then(async () => i18next.changeLanguage(DEFAULT_LANGUAGE));
