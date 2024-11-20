/**
 * Iteration source; shortcut for iterator or iterable.
 *
 * Client applications should **not** rely on long-term availability of this variable as it will be removed once there
 * is widespread support for iterator helpers.
 */
type IterationSource<T> = Iterator<T> | Iterable<T>;

/**
 * Iterator proxy base; provides common functionality for all iterator objects.
 */
abstract class IteratorProxyBase<TInitial, TFinal> implements IteratorObject<TFinal, undefined> {
    /**
     * Convert an iteration source to an iterable.
     *
     * @param iterationSource
     * Iteration source.
     *
     * @returns
     * Iteration source if it is already an iterable, otherwise iteration source wrapped in an iterable.
     */
    protected static toIterable<T>(iterationSource: IterationSource<T>): Iterable<T> {
        return Symbol.iterator in iterationSource ?
            iterationSource :
            {
                [Symbol.iterator](): Iterator<T> {
                    return iterationSource;
                }
            };
    }

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
        this._initialIterable = IteratorProxyBase.toIterable(initialIterationSource);
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
    map<U>(callback: (value: TFinal, index: number) => U): IteratorObject<U, undefined> {
        return new IteratorMapProxy(this, callback);
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
        return new IteratorFilterProxy(this, predicate, true);
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
    reduce<U>(callback: (previousValue: U, currentValue: TFinal, currentIndex: number) => U, initialValue?: U): U {
        let index = 0;
        let result = initialValue;

        for (const value of this) {
            // Need to check arguments length as U could include undefined.
            if (index === 0 && arguments.length === 1) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Initial value is not supplied only when U is identical to TFinal.
                result = value as unknown as U;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Iteration has occurred at least once so result is of the expected type.
                result = callback(result as U, value, index);
            }

            index++;
        }

        if (index === 0 && arguments.length === 1) {
            throw new Error("reduce() of empty iterator with no initial value");
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Iteration has occurred at least once so result is of the expected type.
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
    forEach(callback: (value: TFinal, index: number) => void): void {
        let index = 0;

        for (const element of this) {
            callback(element, index++);
        }
    }

    /**
     * @inheritDoc
     */
    some(predicate: (value: TFinal, index: number) => unknown): boolean {
        // Filter until predicate returns truthy; return true if found.
        return new IteratorFilterProxy(this, predicate, true).next().done !== true;
    }

    /**
     * @inheritDoc
     */
    every(predicate: (value: TFinal, index: number) => unknown): boolean {
        // Filter until predicate returns falsy; return false if found.
        return new IteratorFilterProxy(this, predicate, false).next().done === true;
    }

    /**
     * @inheritDoc
     */
    find(predicate: (value: TFinal, index: number) => unknown): TFinal | undefined {
        // Filter until predicate returns truthy; return value.
        return new IteratorFilterProxy(this, predicate, true).next().value;
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
        // Initial result is the final result.
        return this.initialNext(...value);
    }
}

/**
 * Iterator map proxy base.
 */
abstract class IteratorMapProxyBase<TInitial, TIntermediate, TFinal> extends IteratorProxyBase<TInitial, TFinal> {
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
     * @param value
     * Tuple value to be passed to Iterator.next().
     *
     * @returns
     * Next result from the intermediate iterator.
     */
    protected intermediateNext(...value: [] | [unknown]): IteratorResult<TIntermediate, undefined> {
        const initialResult = this.initialNext(...value);

        return initialResult.done !== true ?
            {
                value: this._callback(initialResult.value, this._index++)
            } :
            {
                done: true,
                value: undefined
            };
    }
}

/**
 * Iterator map proxy.
 */
class IteratorMapProxy<TInitial, TFinal> extends IteratorMapProxyBase<TInitial, TFinal, TFinal> {
    /**
     * @inheritDoc
     */
    next(...value: [] | [unknown]): IteratorResult<TFinal, undefined> {
        // Intermediate result is the final result.
        return this.intermediateNext(...value);
    }
}

/**
 * Iterator flat map proxy.
 */
class IteratorFlatMapProxy<TInitial, TFinal> extends IteratorMapProxyBase<TInitial, IterationSource<TFinal>, TFinal> {
    private _intermediateIterator: Iterator<TFinal, undefined> | undefined;

    /**
     * @inheritDoc
     */
    next(...value: [] | [unknown]): IteratorResult<TFinal, undefined> {
        let finalResult: IteratorResult<TFinal, undefined> | undefined = undefined;

        do {
            if (this._intermediateIterator === undefined) {
                const intermediateResult = this.intermediateNext(...value);

                if (intermediateResult.done === true) {
                    finalResult = intermediateResult;
                } else {
                    this._intermediateIterator = IteratorProxyBase.toIterable(intermediateResult.value)[Symbol.iterator]();
                }
            } else {
                const pendingFinalResult = this._intermediateIterator.next();

                if (pendingFinalResult.done === true) {
                    this._intermediateIterator = undefined;
                } else {
                    finalResult = pendingFinalResult;
                }
            }
        } while (finalResult === undefined);

        return finalResult;
    }
}

/**
 * Iterator filter proxy.
 */
class IteratorFilterProxy<T> extends IteratorProxyBase<T, T> {
    /**
     * Predicate.
     */
    private readonly _predicate: (value: T, index: number) => unknown;

    /**
     * Expected truthy result of the predicate.
     */
    private readonly _expectedTruthy: boolean;

    /**
     * Index into iteration source.
     */
    private _index: number;

    /**
     * Constructor.
     *
     * @param iterationSource
     * Iteration source.
     *
     * @param predicate
     * Predicate.
     *
     * @param expectedTruthy
     * Expected truthy result of the predicate.
     */
    constructor(iterationSource: IterationSource<T>, predicate: (element: T, index: number) => unknown, expectedTruthy: boolean) {
        super(iterationSource);

        this._predicate = predicate;
        this._expectedTruthy = expectedTruthy;

        this._index = 0;
    }

    /**
     * @inheritDoc
     */
    next(...value: [] | [unknown]): IteratorResult<T, undefined> {
        let result: IteratorResult<T, undefined> | undefined;

        const expectedTruthy = this._expectedTruthy;

        do {
            result = this.initialNext(...value);
        } while (result.done !== true && Boolean(this._predicate(result.value, this._index++)) !== expectedTruthy);

        return result;
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
            throw new RangeError("Count must be a positive integer");
        }

        this._count = count;
    }

    /**
     * Determine if iterator is exhausted (by count or by iterator itself).
     */
    protected get exhausted(): boolean {
        return this._count <= 0;
    }

    /**
     * @inheritDoc
     */
    override next(...value: [] | [unknown]): IteratorResult<T, undefined> {
        const result = super.next(...value);

        if (result.done !== true) {
            this._count--;
        } else {
            // Iterator exhausted before count.
            this._count = 0;
        }

        return result;
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
        return !this.exhausted ?
            super.next(...value) :
            {
                done: true,
                value: undefined
            };
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
        while (!this.exhausted) {
            super.next(...value);
        }

        return super.next(...value);
    }
}

/**
 * Get Iterator variable if supported or a proxy for it if not.
 *
 * @returns
 * Iterator variable if supported or a proxy for it if not.
 */
function iteratorProxy(): Pick<typeof Iterator, "from"> {
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
            // This will throw a ReferenceError if Iterator variable is not supported.
            Iterator.from([]);
        } catch (_e) {
            supported = false;
        }
    }

    return supported ?
        Iterator :
        {
            /**
             * @inheritDoc
             */
            from<T>(value: Iterator<T> | Iterable<T>): IteratorObject<T, undefined> {
                return value instanceof IteratorProxyBase ? value : new IteratorProxyObject(value);
            }
        };
}

/**
 * Iterator proxy. In environments where
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator#iterator_helpers |
 * iterator helpers} are supported, this references the {@linkcode Iterator} variable directly. Otherwise, it references
 * an implementation of "from" that uses an internally-defined iterator proxy object.
 *
 * Client applications should **not** rely on long-term availability of this variable as it will be removed once there
 * is widespread support for iterator helpers.
 */
export const IteratorProxy = iteratorProxy();
