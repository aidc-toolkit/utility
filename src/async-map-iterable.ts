/**
 * Asynchronous indexed callback, used to map an input and optionally its index in an iterable to a promised output.
 *
 * @template TInput
 * Input type.
 *
 * @template TOutput
 * Output type.
 *
 * @param input
 * Input value.
 *
 * @param index
 * Index in iterable or undefined for single mapping.
 *
 * @returns
 * Output value.
 */
export type AsyncIndexedCallback<TInput, TOutput> = (input: TInput, index?: number) => Promise<TOutput>;

/**
 * Map an input iterable to an output asynchronous iterable that applies a transformer callback to each value in the
 * input.
 *
 * @template TInput
 * Input type.
 *
 * @template TOutput
 * Output type.
 *
 * @param values
 * Input values iterable.
 *
 * @param indexedCallback
 * Callback to transform input value to output value.
 *
 * @returns
 * Output values asynchronous iterable.
 */
export function asyncMapIterable<TInput, TOutput>(values: Iterable<TInput>, indexedCallback: AsyncIndexedCallback<TInput, TOutput>): AsyncIterable<TOutput> {
    return {
        /**
         * Iterable implementation.
         *
         * @yields
         * Next output value.
         */
        async * [Symbol.asyncIterator](): AsyncIterator<TOutput> {
            let index = 0;

            for (const value of values) {
                yield indexedCallback(value, index++);
            }
        }
    };
}
