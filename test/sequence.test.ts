import { I18nEnvironment } from "@aidc-toolkit/core";
import { describe, expect, test } from "vitest";
import { i18nUtilityInit, Sequence } from "../src";

await i18nUtilityInit(I18nEnvironment.CLI);

describe("Sequence", () => {
    const sequence1 = new Sequence(10, 20);
    const sequence2 = new Sequence(29, -20);

    test("Structure", () => {
        expect(sequence1.startValue).toBe(10n);
        expect(sequence1.endValue).toBe(30n);
        expect(sequence1.count).toBe(20);
        expect(sequence1.minimumValue).toBe(10n);
        expect(sequence1.maximumValue).toBe(29n);

        expect(sequence2.startValue).toBe(29n);
        expect(sequence2.endValue).toBe(9n);
        expect(sequence2.count).toBe(-20);
        expect(sequence2.minimumValue).toBe(10n);
        expect(sequence2.maximumValue).toBe(29n);
    });

    function iterate(): void {
        let expectedValue: bigint;
        let count: number;

        expectedValue = 10n;
        count = 0;

        for (const value of sequence1) {
            expect(value).toBe(expectedValue);

            expectedValue++;
            count++;
        }

        expect(count).toBe(20);

        expectedValue = 29n;
        count = 0;

        for (const value of sequence2) {
            expect(value).toBe(expectedValue);

            expectedValue--;
            count++;
        }

        expect(count).toBe(20);
    }

    test("Iteration", () => {
        iterate();
    });

    test("Repeat", () => {
        iterate();
    });
});
