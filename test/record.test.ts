import { I18NEnvironment } from "@aidc-toolkit/core";
import { describe, expect, test } from "vitest";
import { i18nUtilityInit, RecordValidator } from "../src";

await i18nUtilityInit(I18NEnvironment.CLI);

describe("Record validator", () => {
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
