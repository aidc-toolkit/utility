import { describe, expect, test } from "vitest";
import { IteratorProxy } from "../src/index.js";

const source: readonly string[] = [
    "1", "2", "3", "4", "5"
];

function iterableSource(): Iterable<string> {
    return [...source];
}

function arraySource(): string[] {
    return [...source];
}

function iteratorSource(): Iterator<string> {
    return [...source][Symbol.iterator]();
}

function * generatorSource(): Generator<string> {
    for (const s of source) {
        yield s;
    }
}

function callbackSource(): string[] {
    return [...source];
}

describe("Basic", () => {
    function validateIterable(iterationSource: Iterator<string> | Iterable<string>): void {
        const iteratorProxy = IteratorProxy.from(iterationSource);

        expect(IteratorProxy.from(iteratorProxy)).toBe(iteratorProxy);

        // @ts-expect-error -- Property exists.
        expect(iteratorProxy["_initialIterable"]).toBe(iterationSource);

        expect(Array.from(iteratorProxy)).toStrictEqual(source);
    }

    test("Iterator proxy", () => {
        expect(IteratorProxy).not.toBe(Iterator);
    });

    test("Iterable", () => {
        validateIterable(iterableSource());
    });

    test("Array", () => {
        validateIterable(arraySource());
    });

    test("Iterator", () => {
        validateIterable(iteratorSource());
    });

    test("Generator", () => {
        validateIterable(generatorSource());
    });

    test("Callback", () => {
        validateIterable(callbackSource());
    });
});

describe("Helpers", () => {
    test("Map", () => {
        let count = 0;

        const mapIteratorProxy = IteratorProxy.from(source).map((element, index) => {
            expect(Number(element)).toBe(index + 1);
            expect(index).toBe(count++);

            return -count;
        });

        expect(count).toBe(0);

        let negativeCount = 0;

        for (const element of mapIteratorProxy) {
            expect(element).toBe(--negativeCount);
        }

        expect(count).toBe(source.length);
    });

    test("Flat map", () => {
        let count = 0;

        const flatMapIteratorProxy = IteratorProxy.from(source).flatMap((element, index) => {
            expect(Number(element)).toBe(index + 1);
            expect(index).toBe(count++);

            return [count, -count];
        });

        expect(count).toBe(0);

        let index = 0;

        for (const element of flatMapIteratorProxy) {
            const absoluteElement = Math.floor(index / 2) + 1;

            expect(element).toBe(index % 2 === 0 ? absoluteElement : -absoluteElement);
            index++;
        }

        expect(count).toBe(source.length);
    });

    test("Filter", () => {
        let count = 0;

        const filteredIterable = IteratorProxy.from(source).filter((element, index) => {
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

    test("Take", () => {
        let count = 0;

        for (const element of IteratorProxy.from(source).take(3)) {
            expect(element).toBe(String(++count));
        }

        expect(count).toBe(3);

        count = 0;

        for (const element of IteratorProxy.from(source).take(source.length + 1)) {
            expect(element).toBe(String(++count));
        }

        expect(count).toBe(source.length);

        count = 0;

        for (const element of IteratorProxy.from(source).take(0)) {
            expect(element).toBe(String(++count));
        }

        expect(count).toBe(0);
    });

    test("Drop", () => {
        let count = 0;

        for (const element of IteratorProxy.from(source).drop(3)) {
            expect(element).toBe(String(++count + 3));
        }

        expect(count).toBe(source.length - 3);

        count = 0;

        for (const element of IteratorProxy.from(source).drop(0)) {
            expect(element).toBe(String(++count));
        }

        expect(count).toBe(source.length);

        count = 0;

        for (const element of IteratorProxy.from(source).drop(source.length)) {
            expect(element).toBe(String(++count));
        }

        expect(count).toBe(0);
    });

    test("To array", () => {
        const sourceToArray = IteratorProxy.from(source).toArray();

        expect(sourceToArray).not.toBe(source);
        expect(sourceToArray).toStrictEqual(source);
    });

    test("For each", () => {
        let count = 0;

        IteratorProxy.from(source).forEach((value, index) => {
            expect(Number(value)).toBe(index + 1);
            expect(index).toBe(count++);
        });

        expect(count).toBe(source.length);
    });

    test("Reduce no initial value", () => {
        let count = 0;

        expect(IteratorProxy.from(source).reduce((previousValue, currentValue, currentIndex) => {
            expect(Number(currentValue)).toBe(currentIndex + 1);
            expect(currentIndex - 1).toBe(count++);

            return previousValue + currentValue;
        })).toBe("".concat(...source));

        expect(count).toBe(source.length - 1);

        expect(() => IteratorProxy.from<string>([]).reduce(() => "")).toThrow("reduce() of empty iterator with no initial value");
    });

    test("Reduce initial value", () => {
        let count = 0;

        expect(IteratorProxy.from(source).reduce((previousValue, currentValue, currentIndex) => {
            expect(Number(currentValue)).toBe(currentIndex + 1);
            expect(currentIndex).toBe(count++);

            return previousValue + currentValue;
        }, "0")).toBe("0".concat(...source));

        expect(count).toBe(source.length);

        expect(IteratorProxy.from<string>([]).reduce(() => "", "0")).toBe("0");
    });

    test("Some", () => {
        expect(IteratorProxy.from(source).some(value => value === "3")).toBe(true);
        expect(IteratorProxy.from(source).some(value => value === "6")).toBe(false);
    });

    test("Every", () => {
        expect(IteratorProxy.from(source).every(value => Number(value) > 0)).toBe(true);
        expect(IteratorProxy.from(source).every(value => Number(value) < Number(source[source.length - 1]))).toBe(false);
    });

    test("Find", () => {
        expect(IteratorProxy.from(source).find(value => Number(value) % 3 === 0)).toBe("3");
        expect(IteratorProxy.from(source).find(value => Number(value) % 7 === 0)).toBeUndefined();
    });
});
