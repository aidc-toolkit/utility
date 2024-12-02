/**
 * Transformer input, one of:
 *
 * - T (primitive type)
 * - Iterable<T>
 *
 * @template T
 * Primitive type.
 */
export type TransformerInput<T extends string | number | bigint | boolean> =
    T | Iterable<T>;

/**
 * Transformer callback, used to convert transformed value to its final value.
 *
 * @template TInput
 * Type of input to callback.
 *
 * @template TOutput
 * Type of output to callback.
 *
 * @param input
 * Input value.
 *
 * @param index
 * Index in sequence (0 for single transformation).
 *
 * @returns
 * Output value.
 */
export type TransformerCallback<TInput, TOutput> = (input: TInput, index: number) => TOutput;

/**
 * Transformer output, based on transformer input:
 *
 * - If type T is primitive type, result is type U.
 * - If type T is Iterable type, result is type IterableIterator<U>.
 *
 * @template T
 * Transformer input type.
 *
 * @template U
 * Output base type.
 */
export type TransformerOutput<T extends TransformerInput<string | number | bigint | boolean>, U> =
    T extends (T extends TransformerInput<infer V> ? V : never) ? U : IterableIterator<U>;
