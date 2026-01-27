/**
 * Sequence. Defines an ascending or descending sequence of big integers implemented as an iterable.
 */
export class Sequence implements Iterable<bigint> {
    /**
     * Start value (inclusive).
     */
    readonly #startValue: bigint;

    /**
     * End value (exclusive).
     */
    readonly #endValue: bigint;

    /**
     * Count of values.
     */
    readonly #count: number;

    /**
     * Delta to the next value; equal to the sign of the count.
     */
    readonly #nextDelta: 1n | -1n;

    /**
     * Minimum value (inclusive).
     */
    readonly #minimumValue: bigint;

    /**
     * Maximum value (inclusive).
     */
    readonly #maximumValue: bigint;

    /**
     * Constructor.
     *
     * @param startValue
     * Start value.
     *
     * @param count
     * Count of values. If count is zero or positive, iteration ascends from start value, otherwise it descends from
     * start value.
     */
    constructor(startValue: number | bigint, count: number) {
        this.#startValue = BigInt(startValue);
        this.#endValue = this.#startValue + BigInt(count);
        this.#count = count;

        if (count >= 0) {
            this.#nextDelta = 1n;
            this.#minimumValue = this.#startValue;
            this.#maximumValue = this.#endValue - 1n;
        } else {
            this.#nextDelta = -1n;
            this.#minimumValue = this.#endValue + 1n;
            this.#maximumValue = this.#startValue;
        }
    }

    /**
     * Get the start value (inclusive).
     */
    get startValue(): bigint {
        return this.#startValue;
    }

    /**
     * Get the end value (exclusive).
     */
    get endValue(): bigint {
        return this.#endValue;
    }

    /**
     * Get the count of values.
     */
    get count(): number {
        return this.#count;
    }

    /**
     * Get the minimum value (inclusive).
     */
    get minimumValue(): bigint {
        return this.#minimumValue;
    }

    /**
     * Get the maximum value (inclusive).
     */
    get maximumValue(): bigint {
        return this.#maximumValue;
    }

    /**
     * Iterable implementation.
     *
     * @yields
     * Next value in sequence.
     */
    * [Symbol.iterator](): Generator<bigint> {
        for (let value = this.#startValue; value !== this.#endValue; value += this.#nextDelta) {
            yield value;
        }
    }
}
