import { I18NEnvironment, i18nInit } from "@aidc-toolkit/core";
import { describe, expect, test } from "vitest";
import { RecordValidator } from "../src/index.js";

await i18nInit(I18NEnvironment.CLI, true);

describe("Record validator", () => {
    // eslint-disable-next-line jsdoc/require-jsdoc -- No JSDoc in test files.
    enum StringEnum {
        ValueA = "A",
        ValueB = "B",
        ValueC = "C",
        ValueD = "D"
    }

    const stringEnumRecord: Record<StringEnum, string> = {
        [StringEnum.ValueA]: "This is for Value A",
        [StringEnum.ValueB]: "This is for Value B",
        [StringEnum.ValueC]: "This is for Value C",
        [StringEnum.ValueD]: "This is for Value D"
    };

    test("Validation", () => {
        const stringEnumRecordValidator = new RecordValidator("String enumeration", stringEnumRecord);

        expect(() => {
            stringEnumRecordValidator.validate("A");
        }).not.toThrow(RangeError);
        expect(() => {
            stringEnumRecordValidator.validate("B");
        }).not.toThrow(RangeError);
        expect(() => {
            stringEnumRecordValidator.validate("C");
        }).not.toThrow(RangeError);
        expect(() => {
            stringEnumRecordValidator.validate("D");
        }).not.toThrow(RangeError);
        expect(() => {
            stringEnumRecordValidator.validate("E");
        }).toThrow("String enumeration \"E\" not found");
    });
});
