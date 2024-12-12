import { I18NEnvironment } from "@aidc-toolkit/core";
import { describe, expect, test } from "vitest";
import { i18nUtilityInit, RegExpValidator } from "../src/index.js";

await i18nUtilityInit(I18NEnvironment.CLI);

describe("Regular expression validator", () => {
    test("Validation", () => {
        const anyDigitValidator = new RegExpValidator(/\d+/);
        const allDigitValidator = new RegExpValidator(/^\d+$/);

        expect(() => {
            anyDigitValidator.validate("ABC123DEF");
        }).not.toThrow(RangeError);
        expect(() => {
            allDigitValidator.validate("ABC123DEF");
        }).toThrow("String ABC123DEF does not match pattern");

        expect(() => {
            anyDigitValidator.validate("1234567890");
        }).not.toThrow(RangeError);
        expect(() => {
            allDigitValidator.validate("1234567890");
        }).not.toThrow(RangeError);

        expect(() => {
            anyDigitValidator.validate("123456789O");
        }).not.toThrow(RangeError);
        expect(() => {
            allDigitValidator.validate("123456789O");
        }).toThrow("String 123456789O does not match pattern");
    });

    test("Error message", () => {
        expect(() => {
            new class extends RegExpValidator {
                protected override createErrorMessage(s: string): string {
                    return `Failed to validate "${s}"`;
                }
            }(/[A-Z]+/).validate("1234567890");
        }).toThrow("Failed to validate \"1234567890\"");
    });
});
