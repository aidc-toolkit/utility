/**
 * Iteration source type. The underlying source is an iterable or iterator or a callback to an iterable or iterator.
 */
export type IterationSource<T> = Iterable<T> | Iterator<T> | (() => (Iterable<T> | Iterator<T>));

/**
 * Iteration proxy class for applying a callback for mapping or filtering.
 */
class IterationProxy<T, U, V> implements IterableIterator<V> {
    /**
     * Proxied iterable iterator.
     */
    private readonly _proxiedIterableIterator: IterableIterator<T>;

    /**
     * Callback for map or filter.
     */
    private readonly _callback: (element: T, index: number) => U;

    /**
     * If true, callback is a predicate for a filter.
     */
    private readonly _isPredicate: boolean;

    /**
     * Index into proxied iterable iterator.
     */
    private _index: number;

    /**
     * Constructor.
     *
     * @param proxiedIterableIterator
     * Proxied iterable iterator.
     *
     * @param callback
     * Callback for map or filter.
     *
     * @param isPredicate
     * If true, callback is a predicate for a filter.
     */
    constructor(proxiedIterableIterator: IterableIterator<T>, callback: (element: T, index: number) => U, isPredicate: boolean) {
        this._proxiedIterableIterator = proxiedIterableIterator;
        this._callback = callback;
        this._isPredicate = isPredicate;

        this._index = 0;
    }

    /**
     * {@link Iterable} interface implementation.
     *
     * @returns
     * Iterable iterator.
     */
    [Symbol.iterator](): IterableIterator<V> {
        return this;
    }

    /**
     * {@link Iterator} interface implementation.
     *
     * @param args
     * Arguments.
     *
     * @returns
     * Next element or number or total number of elements if none.
     */
    next(...args: [] | [undefined]): IteratorResult<V, number> {
        let done = false;
        let value: V | undefined;

        let callbackDone: boolean;

        do {
            const proxiedNext = this._proxiedIterableIterator.next(...args);

            if (!(proxiedNext.done ?? false)) {
                const proxiedValue = proxiedNext.value;
                const callbackValue = this._callback(proxiedValue, this._index++);

                if (!this._isPredicate) {
                    // Types U and V are known to be identical.
                    value = callbackValue as unknown as V;

                    callbackDone = true;
                } else {
                    callbackDone = callbackValue as boolean;

                    if (callbackDone) {
                        // Types T and V are known to be identical.
                        value = proxiedValue as unknown as V;
                    }
                }
            } else {
                done = true;
                callbackDone = true;
            }
        } while (!callbackDone);

        return done ?
            {
                done: true,
                value: this._index
            } :
            {
                done: false,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                value: value!
            };
    }
}

/**
 * Iteration helper. Adds array-like functionality through {@link forEach}, {@link map}, {@link filter}, and
 * {@link reduce} methods. Likely to be refactored as {@link
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator#iterator_helpers | iterator
 * helpers} are more widely deployed.
 */
export class IterationHelper<T> implements IterableIterator<T> {
    /**
     * Iteration source.
     */
    private readonly _iterationSource: IterationSource<T>;

    /**
     * Iterable extracted from iteration source.
     */
    private _iterable?: Iterable<T>;

    /**
     * Iterator extracted from iteration source.
     */
    private _iterator?: Iterator<T>;

    /**
     * Constructor.
     *
     * @param iterationSource
     * Iteration source.
     */
    private constructor(iterationSource: IterationSource<T>) {
        this._iterationSource = iterationSource;
    }

    /**
     * Get an iteration helper from an iteration source. If the iteration source is itself an iteration helper, it is
     * returned verbatim, otherwise a new iteration helper is constructed.
     *
     * @param iterationSource
     * Iteration source.
     *
     * @returns
     * Iteration helper.
     */
    static from<T>(iterationSource: IterationSource<T>): IterationHelper<T> {
        return iterationSource instanceof IterationHelper ? iterationSource as IterationHelper<T> : new IterationHelper(iterationSource);
    }

    /**
     * Get the iteration source.
     */
    get iterationSource(): IterationSource<T> {
        return this._iterationSource;
    }

    /**
     * Get the iteration source as an iterable.
     *
     * @returns
     * Iterable.
     */
    asIterable(): Iterable<T> {
        if (this._iterable === undefined) {
            const resolvedIterationSource = typeof this.iterationSource === "function" ? this.iterationSource() : this.iterationSource;

            this._iterable = Symbol.iterator in resolvedIterationSource ?
                resolvedIterationSource :
                {
                    [Symbol.iterator](): Iterator<T> {
                        return resolvedIterationSource;
                    }
                };
        }

        return this._iterable;
    }

    /**
     * Get the iteration source as an array.
     *
     * @returns
     * Array.
     */
    asArray(): readonly T[] {
        const iterable = this.asIterable();

        // Return iterable as array.
        return Array.isArray(iterable) ? iterable as readonly T[] : Array.from(iterable);
    }

    /**
     * Get the iteration source as an iterator.
     *
     * @returns
     * Iterator.
     */
    asIterator(): Iterator<T> {
        if (this._iterator === undefined) {
            this._iterator = this.asIterable()[Symbol.iterator]();
        }

        return this._iterator;
    }

    /**
     * Get the iteration source as a callback.
     *
     * @returns
     * Callback.
     */
    asCallback(): () => IterationSource<T> {
        return typeof this._iterationSource === "function" ? this._iterationSource : () => this._iterationSource;
    }

    /**
     * {@link Iterable} interface implementation.
     *
     * @returns
     * Iterable iterator.
     */
    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

    /**
     * {@link Iterator} interface implementation.
     *
     * @param args
     * Arguments.
     *
     * @returns
     * Next element.
     */
    next(...args: [] | [undefined]): IteratorResult<T, unknown> {
        return this.asIterator().next(...args);
    }

    /**
     * Perform an action for each element in the iteration helper.
     *
     * @param callback
     * Callback that processes the element and its index in the iteration sequence.
     */
    forEach(callback: (element: T, index: number) => void): void {
        let index = 0;

        for (const element of this) {
            callback(element, index++);
        }
    }

    /**
     * Map the iteration helper to another iteration helper by performing an action for each element in the iteration
     * helper along the way.
     *
     * @param callback
     * Callback that processes the element and its index in the iteration sequence.
     *
     * @returns
     * Iterable iterator over callback results.
     */
    map<U>(callback: (element: T, index: number) => U): IterableIterator<U> {
        return new IterationProxy(this, callback, false);
    }

    /**
     * Filter the iteration helper based on the condition specified in a predicate. Each call to `.next()` will iterate
     * as far as necessary until it reaches an element that satisfies the predicate. Care should be taken when working
     * with large iterators and infrequently truthy predicates.
     *
     * @param predicate
     * Predicate that processes the element and its index in the iteration sequence.
     *
     * @returns
     * Iterator iterable over elements that satisfy the predicate.
     */
    filter(predicate: (element: T, index: number) => boolean): IterableIterator<T> {
        return new IterationProxy(this, predicate, true);
    }

    /**
     * Reduce the iterator to a single value by applying a callback.
     *
     * @param callback
     * Callback that processes the previous return value of the callback, the current value of the iterator, and the
     * current index. The initial value is considered to be the first element in the iteration helper.
     *
     * @returns
     * Reduced value.
     */
    reduce(callback: (previousValue: T, currentValue: T, currentIndex: number) => T): T;

    /**
     * Reduce the iterator to a single value by applying a callback.
     *
     * @param callback
     * Callback that processes the previous return value of the callback, the current value of the iterator, and the
     * current index.
     *
     * @param initialValue
     * Initial value, passed as the first previous return value of the callback.
     *
     * @returns
     * Reduced value.
     */
    reduce(callback: (previousValue: T, currentValue: T, currentIndex: number) => T, initialValue: T): T;

    reduce<U>(callback: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue?: U): U {
        let index = 0;
        let result = initialValue;

        for (const value of this) {
            if (index === 0 && initialValue === undefined) {
                result = value as unknown as U;
            } else {
                // Iteration has occurred at least once so result is of the expected type.
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                result = callback(result!, value, index);
            }

            index++;
        }

        if (index === 0 && initialValue === undefined) {
            throw new Error("reduce() of empty iterator with no initial value");
        }

        // Iteration has occurred at least once so result is of the expected type.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return result!;
    }
}
