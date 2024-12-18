import { I18NEnvironment } from "@aidc-toolkit/core";
import { describe, expect, test } from "vitest";
import { EncryptionTransformer, i18nUtilityInit, IdentityTransformer, Sequence, Transformer } from "../src/index.js";

await i18nUtilityInit(I18NEnvironment.CLI);

function testTransformer(domain: number, tweak?: number, callback?: (value: bigint, forwardValue: bigint) => void): void {
    const transformer = Transformer.get(domain, tweak);

    let sequential = true;

    const transformedValuesSet = new Set<bigint>();

    Iterator.from(transformer.forward(new Sequence(0n, domain))).forEach((transformedValue, index) => {
        const indexN = BigInt(index);

        if (sequential && transformedValue !== indexN) {
            sequential = false;
        }

        expect(transformedValuesSet.has(transformedValue)).toBe(false);
        expect(transformer.reverse(transformedValue)).toBe(indexN);

        transformedValuesSet.add(transformedValue);

        if (callback !== undefined) {
            callback(indexN, transformedValue);
        }
    });

    expect(sequential).toBe(tweak === undefined);

    const randomValues = new Array<bigint>();
    const transformedRandomValues = new Array<bigint>();

    for (let i = 0; i < 1000; i++) {
        const randomValue = BigInt(Math.floor(Math.random() * domain));

        randomValues.push(randomValue);
        transformedRandomValues.push(transformer.forward(randomValue));
    }

    expect(Array.from(transformer.forward(randomValues))).toStrictEqual(transformedRandomValues);

    expect(() => transformer.forward(domain)).toThrow(`Value ${domain} must be less than ${domain}`);
    expect(() => transformer.forward(new Sequence(domain, 0))).not.toThrow(RangeError);
    expect(() => transformer.forward(new Sequence(domain - 1, 1))).not.toThrow(RangeError);
    expect(() => transformer.forward(new Sequence(domain, 1))).toThrow(`Maximum value ${domain} must be less than ${domain}`);
    expect(() => transformer.forward(new Sequence(0, -1))).not.toThrow(RangeError);
    expect(() => transformer.forward(new Sequence(-1, -1))).toThrow("Minimum value -1 must be greater than or equal to 0");
}

describe("Identity", () => {
    test("Get", () => {
        const transformer = Transformer.get(1000);

        expect(transformer instanceof IdentityTransformer).toBe(true);
        expect(Transformer.get(1000n)).toBe(transformer);

        expect(transformer.domain).toBe(BigInt(1000n));
    });

    test("Reversible", () => {
        const transformer = Transformer.get(25000000n);

        expect(transformer.reverse(transformer.forward(17171717n))).toBe(17171717n);
    });

    test("Small domain", () => {
        testTransformer(10);
    });

    test("Large domain", () => {
        testTransformer(100000);
    });
});

describe("Encryption", () => {
    test("Get", () => {
        const transformer = Transformer.get(1000, 1234);

        expect(transformer instanceof EncryptionTransformer).toBe(true);
        expect(Transformer.get(1000n, 1234n)).toBe(transformer);

        expect(transformer.domain).toBe(BigInt(1000n));

        const transformer0 = Transformer.get(1000, 0);

        expect(transformer0 instanceof EncryptionTransformer).toBe(true);
        expect(transformer0).not.toBe(Transformer.get(1000));
    });

    test("Reversible", () => {
        const transformer = Transformer.get(25000000n, 12345678901234567890n);

        expect(transformer instanceof EncryptionTransformer).toBe(true);
        expect(transformer.reverse(transformer.forward(17171717n))).toBe(17171717n);
    });

    test("Zero domain", () => {
        expect(() => Transformer.get(0n, 12345678901234567890n)).toThrow("Domain 0 must be greater than 0");
    });

    test("Zero tweak", () => {
        const transformer = Transformer.get(1000n, 0n);

        for (let value = 0n; value < 1000n; value++) {
            expect(transformer.forward(value)).toBe(value);
        }
    });

    test("Small domain and tweak", () => {
        testTransformer(10, 1);
    });

    test("Large domain and tweak", () => {
        testTransformer(100000, 123456);
    });

    test("Byte boundary", () => {
        expect((Transformer.get(256n, 1n) as EncryptionTransformer)["_domainBytes"]).toBe(1);
        expect((Transformer.get(257n, 1n) as EncryptionTransformer)["_domainBytes"]).toBe(2);
        expect((Transformer.get(65536n, 1n) as EncryptionTransformer)["_domainBytes"]).toBe(2);
        expect((Transformer.get(65537n, 1n) as EncryptionTransformer)["_domainBytes"]).toBe(3);

        testTransformer(256, 1);
        testTransformer(257, 1);
    });

    test("Tweak variation", () => {
        expect(Array.from(Transformer.get(1000, 1235).forward(new Sequence(0n, 1000)))).not.toStrictEqual(Array.from(Transformer.get(1000, 1234).forward(new Sequence(0n, 1000))));
    });

    test("Consistency", () => {
        expect(Transformer.get(1000n, 1234n).forward(987n)).toBe(35n);
        expect(Transformer.get(10000n, 12345n).forward(9876n)).toBe(1960n);
        expect(Transformer.get(100000n, 123456n).forward(98765n)).toBe(21407n);
        expect(Transformer.get(1000000n, 1234567n).forward(987654n)).toBe(639402n);
    });
});

describe("Non-sequence", () => {
    function testIterables(sequence: Sequence): void {
        const nonSequence = Array.from(sequence);

        const transformer = Transformer.get(1000n, 1234n);

        const sequenceForward = transformer.forward(sequence);
        const nonSequenceForward = transformer.forward(nonSequence);

        const nonSequenceIterator = nonSequenceForward[Symbol.iterator]();

        for (const sequenceValue of sequenceForward) {
            const nonSequenceNext = nonSequenceIterator.next();

            expect(nonSequenceNext.done).not.toBe(true);
            expect(nonSequenceNext.value).toBe(sequenceValue);
        }
    }

    test("Ascending", () => {
        testIterables(new Sequence(0, 10));
    });

    test("Descending", () => {
        testIterables(new Sequence(9, -10));
    });
});
