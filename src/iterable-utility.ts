/**
 * Indexed callback, used to map an input and optionally its index in an iterable to an output.
 *
 * @param input
 * Input value.
 *
 * @param index
 * Index in iterable or undefined for single mapping).
 *
 * @returns
 * Output value.
 */
export type IndexedCallback<TInput, TOutput> = (input: TInput, index?: number) => TOutput;

/**
 * Map an input iterable to an output iterable that applies a transformer callback to each value in the input.
 *
 * @param values
 * Input values iterable.
 *
 * @param indexedCallback
 * Callback to transform input value to output value.
 *
 * @returns
 * Output values iterable.
 */
export function mapIterable<TInput, TOutput>(values: Iterable<TInput>, indexedCallback: IndexedCallback<TInput, TOutput>): Iterable<TOutput> {
    return {
        /**
         * Iterable implementation.
         *
         * @yields
         * Next output value.
         */
        * [Symbol.iterator](): Generator<TOutput> {
            let index = 0;

            for (const value of values) {
                yield indexedCallback(value, index++);
            }
        }
    };
}
