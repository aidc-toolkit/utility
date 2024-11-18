/**
 * Determine if Iterator variable is supported.
 *
 * @returns
 * True if Iterator variable is supported.
 */
function isIteratorSupported(): boolean {
    let supported: boolean;

    try {
        // Not supported if in testing.
        supported = process.env["NODE_ENV"] !== "test";
    } catch (_e) {
        // Assume supported.
        supported = true;
    }

    if (supported) {
        try {
            Iterator.from([]);
        } catch (_e) {
            supported = false;
        }
    }

    return supported;
}

/**
 * Iteration source; shortcut for iterator or iterable.
 */
export type IterationSource<T> = Iterator<T> | Iterable<T>;

/**
 * Convert an iteration source to an iterable.
 *
 * @param iterationSource
 * Iteration source.
 *
 * @returns
 * Iteration source if it is already an iterable, otherwise iteration source wrapped in an interable.
 */
function iterationSourceToIterable<T>(iterationSource: IterationSource<T>): Iterable<T> {
    return Symbol.iterator in iterationSource ?
        iterationSource :
        {
            [Symbol.iterator](): Iterator<T> {
                return iterationSource;
            }
        };
}

/**
 * Iterator proxy base; provides common functionality for all iterator objects.
 */
abstract class IteratorProxyBase<TInitial, TFinal> implements IteratorObject<TFinal, undefined> {
    /**
     * Initial iterable.
     */
    private readonly _initialIterable: Iterable<TInitial>;

    /**
     * Initial iterator.
     */
    private _initialIterator?: Iterator<TInitial>;

    /**
     * Constructor.
     *
     * @param initialIterationSource
     * Initial iteration source.
     */
    constructor(initialIterationSource: IterationSource<TInitial>) {
        this._initialIterable = iterationSourceToIterable(initialIterationSource);
    }

    /**
     * Get the initial iterable.
     */
    protected get initialIterable(): Iterable<TInitial> {
        return this._initialIterable;
    }

    /**
     * Get the initial iterator.
     */
    protected get initialIterator(): Iterator<TInitial> {
        if (this._initialIterator === undefined) {
            this._initialIterator = this.initialIterable[Symbol.iterator]();
        }

        return this._initialIterator;
    }

    /**
     * @inheritDoc
     */
    get [Symbol.toStringTag](): string {
        return "IteratorProxy";
    }

    /**
     * @inheritDoc
     */
    [Symbol.dispose](): void {
    }

    /**
     * @inheritDoc
     */
    [Symbol.iterator](): IteratorObject<TFinal, undefined> {
        return this;
    }

    /**
     * Get the next result from the initial iterator.
     *
     * @param value
     * Tuple value to be passed to Iterator.next().
     *
     * @returns
     * Next result from the initial iterator.
     */
    protected initialNext(...value: [] | [unknown]): IteratorResult<TInitial, undefined> {
        return this.initialIterator.next(...value);
    }

    /**
     * @inheritDoc
     */
    abstract next(...value: [] | [unknown]): IteratorResult<TFinal, undefined>;

    /**
     * @inheritDoc
     */
    map<U>(callbackfn: (value: TFinal, index: number) => U): IteratorObject<U, undefined> {
        return new IteratorMapProxy(this, callbackfn);
    }

    /**
     * @inheritDoc
     */
    flatMap<U>(callback: (value: TFinal, index: number) => IterationSource<U>): IteratorObject<U, undefined> {
        return new IteratorFlatMapProxy(this, callback);
    }

    /**
     * @inheritDoc
     */
    filter(predicate: (value: TFinal, index: number) => unknown): IteratorObject<TFinal, undefined> {
        return new IteratorFilterProxy(this, predicate);
    }

    /**
     * @inheritDoc
     */
    take(limit: number): IteratorObject<TFinal, undefined> {
        return new IteratorTakeProxy(this, limit);
    }

    /**
     * @inheritDoc
     */
    drop(count: number): IteratorObject<TFinal, undefined> {
        return new IteratorDropProxy(this, count);
    }

    /**
     * @inheritDoc
     */
    reduce<U>(callbackfn: (previousValue: U, currentValue: TFinal, currentIndex: number) => U, initialValue?: U): U {
        let index = 0;
        let result = initialValue;

        for (const value of this) {
            if (index === 0 && initialValue === undefined) {
                // Initial value is undefined only when TFinal and U are identical.
                result = value as unknown as U;
            } else {
                // Iteration has occurred at least once so result is of the expected type.
                result = callbackfn(result as U, value, index);
            }

            index++;
        }

        if (index === 0 && initialValue === undefined) {
            throw new Error("reduce() of empty iterator with no initial value");
        }

        // Iteration has occurred at least once so result is of the expected type.
        return result as U;
    }

    /**
     * @inheritDoc
     */
    toArray(): TFinal[] {
        return Array.from(this);
    }

    /**
     * @inheritDoc
     */
    forEach(callbackfn: (value: TFinal, index: number) => void): void {
        let index = 0;

        for (const element of this) {
            callbackfn(element, index++);
        }
    }

    /**
     * Iterate until the truthy result of the predicate changes or until the iterator is exhausted.
     *
     * @param predicate
     * Predicate.
     *
     * @param initialTruthy
     * Initial truthy result of the predicate.
     *
     * @returns
     * Iterator result.
     */
    private untilChanged(predicate: (value: TFinal, index: number) => unknown, initialTruthy: boolean): IteratorResult<TFinal, undefined> {
        let result: IteratorResult<TFinal, undefined> | undefined;

        const iterator = this[Symbol.iterator]();
        let index = 0;

        do {
            result = iterator.next();

            if (result.done !== true) {
                const truthy = Boolean(predicate(result.value, index++));

                if (truthy === initialTruthy) {
                    result = undefined;
                }
            }
        } while (result === undefined);

        return result;
    }

    /**
     * @inheritDoc
     */
    some(predicate: (value: TFinal, index: number) => unknown): boolean {
        // Iterate until predicate returns truthy; return done status.
        return this.untilChanged(predicate, false).done !== true;
    }

    /**
     * @inheritDoc
     */
    every(predicate: (value: TFinal, index: number) => unknown): boolean {
        // Iterate until predicate returns falsy; return done status.
        return this.untilChanged(predicate, true).done === true;
    }

    /**
     * @inheritDoc
     */
    find(predicate: (value: TFinal, index: number) => unknown): TFinal | undefined {
        // Iterate until predicate returns truthy; return value.
        return this.untilChanged(predicate, false).value;
    }
}

/**
 * Core iterator proxy object.
 */
class IteratorProxyObject<T> extends IteratorProxyBase<T, T> {
    /**
     * @inheritDoc
     */
    next(...value: [] | [unknown]): IteratorResult<T, undefined> {
        return this.initialNext(...value);
    }
}

/**
 * Iterator callback proxy base.
 */
abstract class IteratorCallbackProxyBase<TInitial, TIntermediate, TFinal> extends IteratorProxyBase<TInitial, TFinal> {
    /**
     * Callback.
     */
    private readonly _callback: (element: TInitial, index: number) => TIntermediate;

    /**
     * Index into initial iteration source.
     */
    private _index: number;

    /**
     * Constructor.
     *
     * @param initialIterationSource
     * Initial iteration source.
     *
     * @param callback
     * Callback.
     */
    constructor(initialIterationSource: IterationSource<TInitial>, callback: (element: TInitial, index: number) => TIntermediate) {
        super(initialIterationSource);

        this._callback = callback;
        this._index = 0;
    }

    /**
     * Get the next result from the intermediate iterator.
     *
     * @param initialResult
     * Next result from the initial iterator.
     *
     * @returns
     * Next result from the intermediate iterator.
     */
    protected intermediateNext(initialResult: IteratorResult<TInitial, undefined>): IteratorResult<TIntermediate, undefined> {
        let intermediateResult: IteratorResult<TIntermediate, undefined>;

        if (initialResult.done !== true) {
            intermediateResult = {
                done: false,
                value: this._callback(initialResult.value, this._index++)
            };
        } else {
            intermediateResult = {
                done: true,
                value: undefined
            };
        }

        return intermediateResult;
    }
}

/**
 * Iterator map proxy.
 */
class IteratorMapProxy<TInitial, TFinal> extends IteratorCallbackProxyBase<TInitial, TFinal, TFinal> {
    /**
     * @inheritDoc
     */
    next(...value: [] | [unknown]): IteratorResult<TFinal, undefined> {
        return this.intermediateNext(this.initialNext(...value));
    }
}

/**
 * Iterator flat map proxy.
 */
class IteratorFlatMapProxy<TInitial, TFinal> extends IteratorCallbackProxyBase<TInitial, IterationSource<TFinal>, TFinal> {
    private _pendingFinalIterator: Iterator<TFinal, undefined> | undefined;

    /**
     * @inheritDoc
     */
    next(...value: [] | [unknown]): IteratorResult<TFinal, undefined> {
        let finalResult: IteratorResult<TFinal, undefined> | undefined = undefined;

        do {
            if (this._pendingFinalIterator === undefined) {
                const intermediateResult = this.intermediateNext(this.initialNext(...value));

                if (intermediateResult.done === true) {
                    finalResult = intermediateResult;
                } else {
                    this._pendingFinalIterator = iterationSourceToIterable(intermediateResult.value)[Symbol.iterator]();
                }
            }

            if (this._pendingFinalIterator !== undefined) {
                const pendingFinalResult = this._pendingFinalIterator.next();

                if (pendingFinalResult.done === true) {
                    this._pendingFinalIterator = undefined;
                } else {
                    finalResult = {
                        done: false,
                        value: pendingFinalResult.value
                    };
                }
            }
        } while (finalResult === undefined);

        return finalResult;
    }
}

/**
 * Iterator filter proxy.
 */
class IteratorFilterProxy<T> extends IteratorCallbackProxyBase<T, unknown, T> {
    /**
     * @inheritDoc
     */
    next(...value: [] | [unknown]): IteratorResult<T, undefined> {
        let finalResult: IteratorResult<T, undefined> | undefined = undefined;

        do {
            const initialResult = this.initialNext(...value);

            if (initialResult.done === true) {
                finalResult = {
                    done: true,
                    value: undefined
                };
            } else {
                const intermediateResult = this.intermediateNext(initialResult);
                const booleanValue = Boolean(intermediateResult.value);

                if (booleanValue) {
                    finalResult = {
                        done: false,
                        value: initialResult.value
                    };
                }
            }
        } while (finalResult === undefined);

        return finalResult;
    }
}

/**
 * Iterator count proxy base.
 */
abstract class IteratorCountProxyBase<T> extends IteratorProxyObject<T> {
    /**
     * Count.
     */
    private _count: number;

    /**
     * Constructor.
     *
     * @param initialIterationSource
     * Initial iteration source.
     *
     * @param count
     * Count.
     */
    constructor(initialIterationSource: IterationSource<T>, count: number) {
        super(initialIterationSource);

        if (!Number.isInteger(count) || count < 0) {
            throw new RangeError("Limit must be a positive integer");
        }

        this._count = count;
    }

    /**
     * Determine if count is exhausted.
     */
    protected get countExhausted(): boolean {
        // Decrementing the count may go below zero so use less-than-or-equal comparison.
        return this._count-- <= 0;
    }
}

/**
 * Iterator take proxy.
 */
class IteratorTakeProxy<T> extends IteratorCountProxyBase<T> {
    /**
     * @inheritDoc
     */
    override next(...value: [] | [unknown]): IteratorResult<T, undefined> {
        return this.countExhausted ?
            {
                done: true,
                value: undefined
            } :
            super.next(...value);
    }
}

/**
 * Iterator drop proxy.
 */
class IteratorDropProxy<T> extends IteratorCountProxyBase<T> {
    /**
     * @inheritDoc
     */
    override next(...value: [] | [unknown]): IteratorResult<T, undefined> {
        let result: IteratorResult<T, undefined> | undefined = undefined;

        do {
            result = super.next(...value);

            if (result.done !== true && !this.countExhausted) {
                // Discard result.
                result = undefined;
            }
        } while (result === undefined);

        return result;
    }
}

/**
 * Iterator proxy. In environments where
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator#iterator_helpers |
 * iterator helpers} are supported, this references the @link Iterator} variable directly. Otherwise, it references an
 * implementation of "from" that uses an internally-defined iterator proxy object.
 *
 * Client applications should **not** rely on long-term availability of this variable as it will be removed once there
 * is widespread support for iterator helpers.
 */
export const IteratorProxy: Pick<typeof Iterator, "from"> = isIteratorSupported() ?
    Iterator :
    {
        /**
         * @inheritDoc
         */
        from<T>(value: IterationSource<T>): IteratorObject<T, undefined> {
            return value instanceof IteratorProxyBase ? value : new IteratorProxyObject(value);
        }
    };
