/**
 * Sequencer. Defines an ascending or descending sequence of big integers implemented as an iterable.
 */
export class Sequencer implements Iterable<bigint> {
    /**
     * Start value (inclusive).
     */
    private readonly _startValue: bigint;

    /**
     * End value (exclusive).
     */
    private readonly _endValue: bigint;

    /**
     * Count of values.
     */
    private readonly _count: number;

    /**
     * Delta to the next value; equal to the sign of the count.
     */
    private readonly _nextDelta: 1n | -1n;

    /**
     * Minimum value (inclusive).
     */
    private readonly _minValue: bigint;

    /**
     * Maximum value (inclusive).
     */
    private readonly _maxValue: bigint;

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
        this._startValue = BigInt(startValue);
        this._endValue = this._startValue + BigInt(count);
        this._count = count;

        if (count >= 0) {
            this._nextDelta = 1n;
            this._minValue = this._startValue;
            this._maxValue = this._endValue - 1n;
        } else {
            this._nextDelta = -1n;
            this._minValue = this._endValue + 1n;
            this._maxValue = this._startValue;
        }
    }

    /**
     * Get the start value (inclusive).
     */
    get startValue(): bigint {
        return this._startValue;
    }

    /**
     * Get the end value (exclusive).
     */
    get endValue(): bigint {
        return this._endValue;
    }

    /**
     * Get the count of values.
     */
    get count(): number {
        return this._count;
    }

    /**
     * Get the minimum value (inclusive).
     */
    get minValue(): bigint {
        return this._minValue;
    }

    /**
     * Get the maximum value (inclusive).
     */
    get maxValue(): bigint {
        return this._maxValue;
    }

    /**
     * Iterable implementation.
     *
     * @yields
     * Next value in sequence.
     */
    * [Symbol.iterator](): Generator<bigint> {
        for (let value = this._startValue; value !== this._endValue; value += this._nextDelta) {
            yield value;
        }
    }
}
