import { I18NEnvironment, i18nInit } from "@aidc-toolkit/core";
import { describe, expect, test } from "vitest";
import { IteratorProxy, Sequencer } from "../src/index.js";

await i18nInit(I18NEnvironment.CLI, true);

describe("Sequence", () => {
    const sequencer1 = new Sequencer(10, 20);
    const sequencer2 = new Sequencer(29, -20);

    test("Structure", () => {
        expect(sequencer1.startValue).toBe(10n);
        expect(sequencer1.endValue).toBe(30n);
        expect(sequencer1.count).toBe(20);
        expect(sequencer1.minValue).toBe(10n);
        expect(sequencer1.maxValue).toBe(29n);

        expect(sequencer2.startValue).toBe(29n);
        expect(sequencer2.endValue).toBe(9n);
        expect(sequencer2.count).toBe(-20);
        expect(sequencer2.minValue).toBe(10n);
        expect(sequencer2.maxValue).toBe(29n);
    });

    test("Iteration", () => {
        let expectedValue: bigint;
        let count: number;

        expectedValue = 10n;
        count = 0;

        for (const value of IteratorProxy.from(sequencer1)) {
            expect(value).toBe(expectedValue);

            expectedValue++;
            count++;
        }

        expect(count).toBe(20);

        expectedValue = 29n;
        count = 0;

        for (const value of IteratorProxy.from(sequencer2)) {
            expect(value).toBe(expectedValue);

            expectedValue--;
            count++;
        }

        expect(count).toBe(20);
    });

    test("Reset", () => {
        let expectedValue: bigint;
        let count: number;

        expectedValue = 10n;
        count = 0;

        sequencer1.reset();

        for (const value of IteratorProxy.from(sequencer1)) {
            expect(value).toBe(expectedValue);

            expectedValue++;
            count++;
        }

        expect(count).toBe(20);
    });
});
