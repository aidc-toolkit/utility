import { I18NEnvironment, i18nInit } from "@aidc-toolkit/core";
import { describe, expect, test } from "vitest";
import {
    ALPHABETIC_CREATOR,
    ALPHANUMERIC_CREATOR,
    CharacterSetCreator,
    Exclusion,
    HEXADECIMAL_CREATOR,
    IteratorProxy,
    NUMERIC_CREATOR,
    Sequencer
} from "../src/index.js";

await i18nInit(I18NEnvironment.CLI);

function testCharacterSetCreator(name: string, characterSetCreator: CharacterSetCreator, characterSetSize: number, length: number, excludeFirstZero: boolean, excludeAllNumeric: boolean): void {
    describe(name, () => {
        test("Character set", () => {
            characterSetCreator.characterSet.forEach((c, index) => {
                expect(c).not.toBeUndefined();
                expect(characterSetCreator.characterIndex(c)).toBe(index);
            });

            let s = "";

            for (let index = 0; index < characterSetSize; index++) {
                const c = characterSetCreator.character(index);

                s += c;

                expect(c).not.toBeUndefined();
                expect(characterSetCreator.characterIndex(c)).toBe(index);
            }

            expect(characterSetCreator.character(characterSetSize)).toBeUndefined();

            const characterIndexes = characterSetCreator.characterIndexes(s);

            expect(characterIndexes.length).toBe(characterSetSize);

            characterIndexes.forEach((characterIndex, index) => {
                expect(characterIndex).toBe(index);
            });

            expect(characterSetCreator.exclusionSupport.includes(Exclusion.FirstZero)).toBe(excludeFirstZero);
            expect(characterSetCreator.exclusionSupport.includes(Exclusion.AllNumeric)).toBe(excludeAllNumeric);
        });

        function testCreate(exclusion: Exclusion): void {
            let domain: number;

            switch (exclusion) {
                case Exclusion.FirstZero:
                    expect(() => characterSetCreator.create(0, 0, Exclusion.FirstZero)).toThrow("Domain 0 must be greater than 0");
                    domain = (characterSetSize - 1) * characterSetSize ** (length - 1);
                    break;

                case Exclusion.AllNumeric:
                    expect(() => characterSetCreator.create(0, 0, Exclusion.AllNumeric)).toThrow("Domain 0 must be greater than 0");
                    domain = characterSetSize ** length - 10 ** length;
                    break;

                default:
                    domain = characterSetSize ** length;
                    break;
            }

            const sequence = IteratorProxy.from(characterSetCreator.create(length, new Sequencer(0n, domain), exclusion));

            let previousS = "";

            let sequenceCount = 0;

            sequence.forEach((s, index) => {
                expect(s > previousS).toBe(true);
                previousS = s;

                expect(s.length).toBe(length);

                expect(characterSetCreator.valueFor(s, exclusion)).toBe(BigInt(index));

                sequenceCount++;
            });

            expect(sequenceCount).toBe(domain);

            expect(() => characterSetCreator.create(length, domain, exclusion)).toThrow(`Value ${domain} must be less than ${domain}`);

            const sparseSequence = IteratorProxy.from(characterSetCreator.create(length, new Sequencer(domain - 1, -domain), exclusion, 123456n));

            let sequential = true;
            previousS = "~";

            const sequenceSet = new Set<string>();

            sequenceCount = 0;

            sparseSequence.forEach((s, index) => {
                sequential = sequential && s < previousS;
                previousS = s;

                expect(s.length).toBe(length);

                expect(sequenceSet.has(s)).toBe(false);
                sequenceSet.add(s);

                expect(characterSetCreator.valueFor(s, exclusion, 123456n)).toBe(BigInt(domain - index - 1));

                sequenceCount++;
            });

            expect(sequential).toBe(false);
            expect(sequenceCount).toBe(domain);

            const randomValues = new Array<bigint>();
            const straightRandomValues = new Array<string>();
            const sparseRandomValues = new Array<string>();

            for (let i = 0; i < 1000; i++) {
                const randomValue = BigInt(Math.floor(Math.random() * domain));

                randomValues.push(randomValue);
                straightRandomValues.push(characterSetCreator.create(length, randomValue, exclusion));
                sparseRandomValues.push(characterSetCreator.create(length, randomValue, exclusion, 123456n));
            }

            expect(Array.from(characterSetCreator.create(length, randomValues, exclusion))).toStrictEqual(straightRandomValues);
            expect(Array.from(characterSetCreator.create(length, randomValues, exclusion, 123456n))).toStrictEqual(sparseRandomValues);

            expect(() => characterSetCreator.create(length, domain, exclusion, 123456n)).toThrow(`Value ${domain} must be less than ${domain}`);
        }

        test("Length", () => {
            expect(() => characterSetCreator.create(0, 0)).not.toThrow(RangeError);
            expect(() => characterSetCreator.create(-1, 0)).toThrow("Length -1 must be greater than or equal to 0");
            expect(() => characterSetCreator.create(40, 0)).not.toThrow(RangeError);
            expect(() => characterSetCreator.create(41, 0)).toThrow("Length 41 must be less than or equal to 40");
        });

        test("Create sequence", () => {
            testCreate(Exclusion.None);
        });

        if (excludeFirstZero) {
            test("Create sequence, exclude first zero", () => {
                testCreate(Exclusion.FirstZero);

                expect(() => characterSetCreator.valueFor("0000", Exclusion.FirstZero)).toThrow("Invalid character '0' at position 1");
                expect(() => characterSetCreator.valueFor("1000", Exclusion.FirstZero)).not.toThrow(RangeError);
            });
        }

        if (excludeAllNumeric) {
            test("Create sequence, exclude all numeric", () => {
                testCreate(Exclusion.AllNumeric);

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Nine is known to be present in the character set.
                const afterNine = characterSetCreator.character(characterSetCreator.characterIndex("9")! + 1);

                expect(() => characterSetCreator.valueFor("0000", Exclusion.AllNumeric)).toThrow("String must not be all numeric");
                expect(() => characterSetCreator.valueFor(`000${afterNine}`, Exclusion.AllNumeric)).not.toThrow(RangeError);
                expect(() => characterSetCreator.valueFor("9999", Exclusion.AllNumeric)).toThrow("String must not be all numeric");
                expect(() => characterSetCreator.valueFor(`999${afterNine}`, Exclusion.AllNumeric)).not.toThrow(RangeError);
            });
        }
    });
}

describe("Exclusion", () => {
    test("First zero", () => {
        expect(() => new CharacterSetCreator([
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
        ], Exclusion.FirstZero)).not.toThrow(RangeError);
        expect(() => new CharacterSetCreator([
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"
        ], Exclusion.FirstZero)).toThrow("Character set must support zero as first character");
    });

    test("All numeric", () => {
        expect(() => new CharacterSetCreator([
            "!", "#", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D"
        ], Exclusion.AllNumeric)).not.toThrow(RangeError);
        expect(() => new CharacterSetCreator([
            "!", "#", "/", "0", "1", "2", "3", "A", "B", "C", "D"
        ], Exclusion.AllNumeric)).toThrow("Character set must support all numeric characters in sequence");
        expect(() => new CharacterSetCreator([
            "!", "#", "/", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "A", "B", "C", "D"
        ], Exclusion.AllNumeric)).toThrow("Character set must support all numeric characters in sequence");
    });
});

testCharacterSetCreator("Numeric", NUMERIC_CREATOR, 10, 4, true, false);
testCharacterSetCreator("Hexadecimal", HEXADECIMAL_CREATOR, 16, 4, true, true);
testCharacterSetCreator("Alphabetic", ALPHABETIC_CREATOR, 26, 3, false, false);
testCharacterSetCreator("Alphanumeric", ALPHANUMERIC_CREATOR, 36, 3, true, true);
testCharacterSetCreator("Middle numeric", new CharacterSetCreator([
    "(", ")",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "<", ">"
], Exclusion.AllNumeric), 14, 4, false, true);
