import { describe, expect, test } from "vitest";
import { IterationHelper, type IterationSource } from "../src/index.js";

const source: readonly string[] = [
    "1", "2", "3", "4", "5"
];

// eslint-disable-next-line jsdoc/require-jsdoc
function iterableSource(): Iterable<string> {
    return [...source];
}

// eslint-disable-next-line jsdoc/require-jsdoc
function arraySource(): string[] {
    return [...source];
}

// eslint-disable-next-line jsdoc/require-jsdoc
function iteratorSource(): Iterator<string> {
    return [...source][Symbol.iterator]();
}

// eslint-disable-next-line jsdoc/require-jsdoc
function * generatorSource(): Generator<string> {
    for (const s of source) {
        yield s;
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function callbackSource(): string[] {
    return [...source];
}

describe("Iterable", () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    function validateIterable(iterationSource: IterationSource<string>, testEquality: boolean): void {
        const iterationHelper = IterationHelper.from(iterationSource);

        expect(IterationHelper.from(iterationHelper)).toBe(iterationHelper);
        expect(iterationHelper.iterationSource).toBe(iterationSource);

        expect(iterationHelper.asIterable() === iterationSource).toBe(testEquality);
        expect(Array.from(iterationHelper)).toStrictEqual(source);
    }

    test("Iterable", () => {
        validateIterable(iterableSource, false);
        validateIterable(iterableSource(), true);
    });

    test("Array", () => {
        validateIterable(arraySource, false);
        validateIterable(arraySource(), true);
    });

    test("Iterator", () => {
        validateIterable(iteratorSource, false);
        validateIterable(iteratorSource(), true);
    });

    test("Generator", () => {
        validateIterable(generatorSource, false);
        validateIterable(generatorSource(), true);
    });

    test("Callback", () => {
        validateIterable(callbackSource, false);
        validateIterable(callbackSource(), true);
    });
});

describe("Array", () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    function validateArray(iterationSource: IterationSource<string>, testEquality: boolean): void {
        const iterationHelper = IterationHelper.from(iterationSource);

        expect(IterationHelper.from(iterationHelper)).toBe(iterationHelper);
        expect(iterationHelper.iterationSource).toBe(iterationSource);

        const array = iterationHelper.asArray();

        expect(array === iterationSource).toBe(testEquality);
        expect(array).toStrictEqual(source);
    }

    test("Iterable", () => {
        validateArray(iterableSource, false);
        validateArray(iterableSource(), true);
    });

    test("Array", () => {
        validateArray(arraySource, false);
        validateArray(arraySource(), true);
    });

    test("Iterator", () => {
        validateArray(iteratorSource, false);
        validateArray(iteratorSource(), false);
    });

    test("Generator", () => {
        validateArray(generatorSource, false);
        validateArray(generatorSource(), false);
    });

    test("Callback", () => {
        validateArray(callbackSource, false);
        validateArray(callbackSource(), true);
    });
});

describe("Iterator", () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    function validateIterator(iterationSource: IterationSource<string>, testEquality: boolean): void {
        const iterationHelper = IterationHelper.from(iterationSource);

        expect(IterationHelper.from(iterationHelper)).toBe(iterationHelper);
        expect(iterationHelper.iterationSource).toBe(iterationSource);

        const iterator = iterationHelper.asIterator();

        expect(iterator === iterationSource).toBe(testEquality);
        expect(Array.from({
            [Symbol.iterator](): Iterator<string> {
                return iterator;
            }
        })).toStrictEqual(source);
    }

    test("Iterable", () => {
        validateIterator(iterableSource, false);
        validateIterator(iterableSource(), false);
    });

    test("Array", () => {
        validateIterator(arraySource, false);
        validateIterator(arraySource(), false);
    });

    test("Iterator", () => {
        validateIterator(iteratorSource, false);
        validateIterator(iteratorSource(), true);
    });

    test("Generator", () => {
        validateIterator(generatorSource, false);
        validateIterator(generatorSource(), true);
    });

    test("Callback", () => {
        validateIterator(callbackSource, false);
        validateIterator(callbackSource(), false);
    });
});

describe("Callback", () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    function validateCallback(iterationSource: IterationSource<string>, testEquality: boolean): void {
        const iterationHelper = IterationHelper.from(iterationSource);

        expect(IterationHelper.from(iterationHelper)).toBe(iterationHelper);
        expect(iterationHelper.iterationSource).toBe(iterationSource);

        expect(iterationHelper.asCallback() === iterationSource).toBe(testEquality);
        expect(iterationHelper.asArray()).toStrictEqual(source);
    }

    test("Iterable", () => {
        validateCallback(iterableSource, true);
        validateCallback(iterableSource(), false);
    });

    test("Array", () => {
        validateCallback(arraySource, true);
        validateCallback(arraySource(), false);
    });

    test("Iterator", () => {
        validateCallback(iteratorSource, true);
        validateCallback(iteratorSource(), false);
    });

    test("Generator", () => {
        validateCallback(generatorSource, true);
        validateCallback(generatorSource(), false);
    });

    test("Callback", () => {
        validateCallback(callbackSource, true);
        validateCallback(callbackSource(), false);
    });
});

describe("Helpers", () => {
    test("For each", () => {
        let count = 0;

        IterationHelper.from(source).forEach((value, index) => {
            expect(Number(value)).toBe(index + 1);
            expect(index).toBe(count++);
        });

        expect(count).toBe(source.length);
    });

    test("Map", () => {
        let count = 0;

        const mappedIterationHelper = IterationHelper.from(source).map((element, index) => {
            expect(Number(element)).toBe(index + 1);
            expect(index).toBe(count++);

            return -count;
        });

        expect(count).toBe(0);

        let negativeCount = 0;

        for (const element of mappedIterationHelper) {
            expect(element).toBe(--negativeCount);
        }

        expect(count).toBe(source.length);
    });

    test("Filter", () => {
        let count = 0;

        const filteredIterable = IterationHelper.from(source).filter((element, index) => {
            expect(Number(element)).toBe(index + 1);
            expect(index).toBe(count++);

            return Number(element) % 2 === 0;
        });

        expect(count).toBe(0);

        let evenCount = 0;

        for (const element of filteredIterable) {
            const n = Number(element);

            expect(n % 2).toBe(0);
            expect(Math.floor((n - 1) / 2)).toBe(evenCount++);
        }

        expect(count).toBe(source.length);
        expect(evenCount).toBe(Math.floor(source.length / 2));
    });

    test("Reduce no initial value", () => {
        let count = 0;

        expect(IterationHelper.from(source).reduce((previousValue, currentValue, currentIndex) => {
            expect(Number(currentValue)).toBe(currentIndex + 1);
            expect(currentIndex - 1).toBe(count++);

            return previousValue + currentValue;
        })).toBe("".concat(...source));

        expect(count).toBe(source.length - 1);

        expect(() => IterationHelper.from<string>([]).reduce(() => "")).toThrow("reduce() of empty iterator with no initial value");
    });

    test("Reduce initial value", () => {
        let count = 0;

        expect(IterationHelper.from(source).reduce((previousValue, currentValue, currentIndex) => {
            expect(Number(currentValue)).toBe(currentIndex + 1);
            expect(currentIndex).toBe(count++);

            return previousValue + currentValue;
        }, "0")).toBe("0".concat(...source));

        expect(count).toBe(source.length);

        expect(IterationHelper.from<string>([]).reduce(() => "", "0")).toBe("0");
    });
});
