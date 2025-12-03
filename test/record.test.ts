import { describe, expect, test } from "vitest";
import { RecordValidator } from "../src";

describe("Record validator", () => {
    const StringIndexes = {
        ValueA: "A",
        ValueB: "B",
        ValueC: "C",
        ValueD: "D"
    } as const;

    type StringIndexKey = keyof typeof StringIndexes;

    type StringIndex = typeof StringIndexes[StringIndexKey];

    const stringRecord: Record<StringIndex, string> = {
        [StringIndexes.ValueA]: "This is for Value A",
        [StringIndexes.ValueB]: "This is for Value B",
        [StringIndexes.ValueC]: "This is for Value C",
        [StringIndexes.ValueD]: "This is for Value D"
    };

    test("Validation", () => {
        const stringRecordValidator = new RecordValidator("String index", stringRecord);

        expect(() => {
            stringRecordValidator.validate("A");
        }).not.toThrow(RangeError);
        expect(() => {
            stringRecordValidator.validate("B");
        }).not.toThrow(RangeError);
        expect(() => {
            stringRecordValidator.validate("C");
        }).not.toThrow(RangeError);
        expect(() => {
            stringRecordValidator.validate("D");
        }).not.toThrow(RangeError);
        expect(() => {
            stringRecordValidator.validate("E");
        }).toThrow("String index \"E\" not found");
    });
});
