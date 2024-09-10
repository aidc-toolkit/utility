import { IterationHelper, type IterationSource } from "./iteration.js";
import i18next, { utilityNS } from "./locale/i18n.js";

/**
 * Transformation callback, used to convert transformed value to its final value.
 *
 * @template T
 * Type returned by callback.
 *
 * @param transformedValue
 * Transformed value.
 *
 * @param index
 * Index in sequence transformation (0 for single transformation).
 *
 * @returns
 * Final value.
 */
export type TransformationCallback<T> = (transformedValue: bigint, index: number) => T;

/**
 * Transformer that transforms values in a numeric domain to values in a range equal to the domain or to another range
 * defined by a callback function. In other words, the domain determines valid input values and, without a callback, the
 * range of valid output values.
 *
 * The concept is similar to {@link https://en.wikipedia.org/wiki/Format-preserving_encryption | format-preserving
 * encryption}, where input values within a specified domain (e.g., {@link
 * https://en.wikipedia.org/wiki/Payment_card_number | payment card numbers} ranging from 8-19 digits) are transformed
 * into values in the same domain, typically for storage in a database where the data type and length are already fixed
 * and exfiltration of the data can have significant repercussions.
 *
 * Two subclasses are supported directly by this class: {@link IdentityTransformer} (which operates based on a domain
 * only) and {@link EncryptionTransformer} (which operates based on a domain and a tweak). If an application is expected
 * to make repeated use of a transformer with the same domain and (optional) tweak and can't manage the transformer
 * object, an in-memory cache is available via the {@link get} method. Properties in {@link IdentityTransformer} and
 * {@link EncryptionTransformer} are read-only once constructed, so there is no issue with their shared use.
 */
export abstract class Transformer {
    /**
     * Transformers cache, mapping a domain to another map, which maps an optional tweak to a transformer.
     */
    private static readonly TRANSFORMER_MAPS_MAP = new Map<bigint, Map<bigint | undefined, Transformer>>();

    /**
     * Domain.
     */
    private readonly _domain: bigint;

    /**
     * Constructor.
     *
     * @param domain
     * Domain.
     */
    constructor(domain: bigint) {
        if (domain <= 0n) {
            throw new RangeError(i18next.t("Transformer.domainMustBeGreaterThanZero", {
                ns: utilityNS,
                domain
            }));
        }

        this._domain = BigInt(domain);
    }

    /**
     * Get a transformer, constructing it if necessary. The type returned is {@link IdentityTransformer} if tweak is
     * undefined, {@link EncryptionTransformer} if tweak is defined. Note that although an {@link EncryptionTransformer}
     * with a zero tweak operates as an {@link IdentityTransformer}, {@link EncryptionTransformer} is still the type
     * returned if a zero tweak is explicitly specified.
     *
     * @param domain
     * Domain.
     *
     * @param tweak
     * Tweak.
     *
     * @returns
     * {@link IdentityTransformer} if tweak is undefined, {@link EncryptionTransformer} if tweak is defined.
     */
    static get(domain: number | bigint, tweak?: number | bigint): Transformer {
        const domainN = BigInt(domain);

        let transformersMap = Transformer.TRANSFORMER_MAPS_MAP.get(domainN);

        if (transformersMap === undefined) {
            transformersMap = new Map();
            Transformer.TRANSFORMER_MAPS_MAP.set(domainN, transformersMap);
        }

        const tweakN = tweak === undefined ? undefined : BigInt(tweak);

        let transformer = transformersMap.get(tweakN);

        if (transformer === undefined) {
            transformer = tweakN === undefined ? new IdentityTransformer(domainN) : new EncryptionTransformer(domainN, tweakN);
            transformersMap.set(tweakN, transformer);
        }

        return transformer;
    }

    /**
     * Get the domain.
     */
    get domain(): bigint {
        return this._domain;
    }

    /**
     * Validate that a start value and count are within the domain.
     *
     * @param startValue
     * Start value of range to validate.
     *
     * @param count
     * Number of entries in the range to validate or 1 if undefined.
     */
    private validate(startValue: bigint, count?: number): void {
        if (startValue < 0n) {
            throw new RangeError(i18next.t(count === undefined ? "Transformer.valueMustBeGreaterThanOrEqualToZero" : "Transformer.startValueMustBeGreaterThanOrEqualToZero", {
                ns: utilityNS,
                startValue
            }));
        }

        const endValue = count === undefined ? startValue : startValue + BigInt(count - 1);

        if (endValue >= this.domain) {
            throw new RangeError(i18next.t(count === undefined ? "Transformer.valueMustBeLessThan" : "Transformer.endValueMustBeLessThan", {
                ns: utilityNS,
                endValue,
                domain: this.domain
            }));
        }
    }

    /**
     * Do the work of transforming a value forward.
     *
     * @param value
     * Value.
     *
     * @returns
     * Transformed value.
     */
    protected abstract doForward(value: bigint): bigint;

    /**
     * Transform a value forward.
     *
     * @param value
     * Value.
     *
     * @returns
     * Transformed value.
     */
    forward(value: bigint): bigint;

    /**
     * Transform a value forward.
     *
     * @template T
     * Type returned by transformation callback or bigint if none.
     *
     * @param value
     * Value.
     *
     * @param transformationCallback
     * Called after the value is transformed to convert it to its final value.
     *
     * @returns
     * Value transformed into object.
     */
    forward<T>(value: bigint, transformationCallback: TransformationCallback<T>): T;

    forward<T>(value: bigint, transformationCallback?: TransformationCallback<T>): bigint | T {
        this.validate(value);

        const transformedValue = this.doForward(value);

        return transformationCallback === undefined ? transformedValue : transformationCallback(transformedValue, 0);
    }

    /**
     * Do the work for the forward sequence method. Parameters are as defined in the public methods.
     *
     * @template T
     * See public methods.
     *
     * @param startValue
     * See public methods.
     *
     * @param count
     * See public methods.
     *
     * @param transformationCallback
     * See public methods.
     *
     * @yields
     * Transformed value optionally defined by transformation callback.
     */
    private * doForwardSequence<T>(startValue: bigint, count: number, transformationCallback?: TransformationCallback<T>): Generator<bigint | T> {
        for (let index = 0, value = startValue; index < count; index++, value++) {
            const transformedValue = this.doForward(value);

            yield transformationCallback !== undefined ? transformationCallback(transformedValue, index) : transformedValue;
        }
    }

    /**
     * Transform a sequence of values forward.
     *
     * @param startValue
     * Numerical value of the first object. Objects are created from `startValue` to `startValue + count - 1`.
     *
     * @param count
     * Number of objects to create.
     *
     * @yields
     * Transformed value.
     */
    forwardSequence(startValue: bigint, count: number): IterableIterator<bigint>;

    /**
     * Transform a sequence of values forward.
     *
     * @template T
     * Type returned by transformation callback or bigint if none.
     *
     * @param startValue
     * Numerical value of the first object. Objects are created from `startValue` to `startValue + count - 1`.
     *
     * @param count
     * Number of objects to create.
     *
     * @param transformationCallback
     * Transformation callback called after the value is transformed to convert it to its final value.
     *
     * @returns
     * Iterable iterator over transformed values as defined by transformation callback.
     */
    forwardSequence<T>(startValue: bigint, count: number, transformationCallback: TransformationCallback<T>): IterableIterator<T>;

    forwardSequence<T>(startValue: bigint, count: number, transformationCallback?: TransformationCallback<T>): IterableIterator<bigint | T> {
        this.validate(startValue, count);

        return this.doForwardSequence(startValue, count, transformationCallback);
    }

    /**
     * Transform multiple values forward.
     *
     * @param valuesSource
     * Source of values.
     *
     * @returns
     * Iterable iterator over transformed values.
     */
    forwardMultiple(valuesSource: IterationSource<bigint>): IterableIterator<bigint>;

    /**
     * Transform multiple values forward.
     *
     * @template T
     * Type returned by transformation callback or bigint if none.
     *
     * @param valuesSource
     * Source of values.
     *
     * @param transformationCallback
     * Transformation callback called after the value is transformed to convert it to its final value.
     *
     * @returns
     * Iterable iterator over transformed values as defined by transformation callback.
     */
    forwardMultiple<T>(valuesSource: IterationSource<bigint>, transformationCallback: TransformationCallback<T>): IterableIterator<T>;

    forwardMultiple<T>(valuesSource: IterationSource<bigint>, transformationCallback?: TransformationCallback<T>): IterableIterator<bigint | T> {
        return IterationHelper.from(valuesSource).map((value, index) => {
            this.validate(value);

            const transformedValue = this.doForward(value);

            return transformationCallback !== undefined ? transformationCallback(transformedValue, index) : transformedValue;
        });
    }

    /**
     * Do the work of transforming a value in reverse.
     *
     * @param transformedValue
     * Transformed value.
     *
     * @returns
     * Value.
     */
    protected abstract doReverse(transformedValue: bigint): bigint;

    /**
     * Transform a value in reverse.
     *
     * @param transformedValue
     * Transformed value.
     *
     * @returns
     * Value.
     */
    reverse(transformedValue: bigint): bigint {
        this.validate(transformedValue);

        return this.doReverse(transformedValue);
    }
}

/**
 * Identity transformer. Values are transformed to themselves.
 */
export class IdentityTransformer extends Transformer {
    protected doForward(value: bigint): bigint {
        return value;
    }

    protected doReverse(transformedValue: bigint): bigint {
        return transformedValue;
    }
}

/**
 * Encryption transformer. Values are transformed using repeated shuffle and xor operations. The underlying operations
 * are similar to those found in many cryptography algorithms, particularly AES. While sufficient for obfuscation of
 * numeric sequences (e.g., serial number generation, below), if true format-preserving encryption is required, a more
 * robust algorithm such as {@link https://doi.org/10.6028/NIST.SP.800-38Gr1-draft | FF1} is recommended.
 *
 * The purpose of the encryption transformer is to generate pseudo-random values in a deterministic manner to obscure
 * the sequence of values generated over time. A typical example is for serial number generation, where knowledge of the
 * sequence can infer production volumes (e.g., serial number 1000 implies that at least 1,000 units have been
 * manufactured) or can be used in counterfeiting (e.g., a counterfeiter can generate serial numbers 1001, 1002, ...
 * with reasonable confidence that they would be valid if queried).
 *
 * The domain and the tweak together determine the encryption key, which in turn determines the number of rounds of
 * shuffle and xor operations. The minimum number of rounds is 4, except where the domain is less than or equal to 256,
 * which results in single-byte operations. To ensure that the operations are effective for single-byte domains, the
 * number of rounds is 1 and only the xor operation is applied (shuffling a single byte is an identity operation).
 *
 * Another exception is when there is a tweak value of 0; this results in identity operations where the output value is
 * identical to the input value, as no shuffle or xor takes place.
 */
export class EncryptionTransformer extends Transformer {
    /**
     * Individual bits, pre-calculated for performance.
     */
    private static readonly BITS = new Uint8Array([
        0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80
    ]);

    /**
     * Inverse individual bits, pre-calculated for performance.
     */
    private static readonly INVERSE_BITS = new Uint8Array([
        0xFE, 0xFD, 0xFB, 0xF7, 0xEF, 0xDF, 0xBF, 0x7F
    ]);

    /**
     * Number of bytes covered by the domain.
     */
    private readonly _domainBytes: number;

    /**
     * Tweak.
     */
    private readonly _tweak: bigint;

    /**
     * Xor bytes array generated from the domain and tweak.
     */
    private readonly _xorBytes: Uint8Array;

    /**
     * Bits array generated from the domain and tweak.
     */
    private readonly _bits: Uint8Array;

    /**
     * Inverse bits array generated from the domain and tweak.
     */
    private readonly _inverseBits: Uint8Array;

    /**
     * Number of rounds (length of arrays) generated from the domain and tweak.
     */
    private readonly _rounds: number;

    /**
     * Constructor.
     *
     * @param domain
     * Domain.
     *
     * @param tweak
     * Tweak.
     */
    constructor(domain: bigint, tweak: bigint) {
        super(domain);

        if (tweak < 0n) {
            throw new RangeError(i18next.t("Transformer.tweakMustBeGreaterThanOrEqualToZero", {
                ns: utilityNS,
                tweak
            }));
        }

        let domainBytes = 0;

        // The number of bytes in the domain determines the size of the shuffle and xor operations.
        for (let reducedDomainMinusOne = domain - 1n; reducedDomainMinusOne !== 0n; reducedDomainMinusOne = reducedDomainMinusOne >> 8n) {
            domainBytes++;
        }

        this._domainBytes = domainBytes;
        this._tweak = tweak;

        const xorBytes = new Array<number>();
        const bits = new Array<number>();
        const inverseBits = new Array<number>();

        // Key is the product of domain, tweak, and an 8-digit prime to force at least four rounds.
        for (let reducedKey = domain * tweak * 603868999n; reducedKey !== 0n; reducedKey = reducedKey >> 8n) {
            // Extract least-significant byte.
            const keyByte = Number(reducedKey & 0xFFn);

            xorBytes.unshift(keyByte);

            // Bit number is the key byte mod 8.
            const bitNumber = keyByte & 0x07;

            // Bits are applied in reverse order so that they don't correlate directly with the key bytes at the same index.
            bits.push(EncryptionTransformer.BITS[bitNumber]);
            inverseBits.push(EncryptionTransformer.INVERSE_BITS[bitNumber]);
        }

        // Domains occupying a single byte will not shuffle and will map all values to themselves for very small domains.
        if (domainBytes === 1) {
            // Determine the lowest possible mask that will cover all values in the domain.
            const domainMask = EncryptionTransformer.BITS.filter(bit => bit < domain).reduce((accumulator, bit) => accumulator | bit, 0);

            // Reduce all xor bytes to a single byte and strip higher bits.
            this._xorBytes = new Uint8Array([xorBytes.reduce((accumulator, xorByte) => accumulator ^ xorByte, 0) & domainMask]);

            // Bits and inverse bits are irrelevant as there will be no shuffling; choose first bit arbitrarily.
            this._bits = new Uint8Array([EncryptionTransformer.BITS[0]]);
            this._inverseBits = new Uint8Array([EncryptionTransformer.INVERSE_BITS[0]]);

            // Everything will be done in one round.
            this._rounds = 1;
        } else {
            this._xorBytes = new Uint8Array(xorBytes);
            this._bits = new Uint8Array(bits);
            this._inverseBits = new Uint8Array(inverseBits);
            this._rounds = xorBytes.length;
        }
    }

    /**
     * Get the tweak.
     */
    get tweak(): bigint {
        return this._tweak;
    }

    /**
     * Convert a value to a byte array big enough to handle the entire domain.
     *
     * @param value
     * Value.
     *
     * @returns
     * Big-endian byte array equivalent to the value.
     */
    private valueToBytes(value: bigint): Uint8Array {
        const bytes = new Uint8Array(this._domainBytes);

        let reducedValue = value;

        // Build byte array in reverse order to get as big-endian.
        for (let index = this._domainBytes - 1; index >= 0; index--) {
            bytes[index] = Number(reducedValue & 0xFFn);

            reducedValue = reducedValue >> 8n;
        }

        return bytes;
    }

    /**
     * Convert a byte array to a value.
     *
     * @param bytes
     * Big-endian byte array equivalent to the value.
     *
     * @returns
     * Value.
     */
    private static bytesToValue(bytes: Uint8Array): bigint {
        return bytes.reduce((accumulator, byte) => {
            return accumulator << 8n | BigInt(byte);
        }, 0n);
    }

    /**
     * Shuffle a byte array.
     *
     * The input array to the forward operation (output from the reverse operation) is `bytes` and the output array from
     * the forward operation (input to the reverse operation) is `bytes'`.
     *
     * The shuffle operation starts by testing the bit at `bits[round]` for each `byte` in `bytes`. The indexes for all
     * bytes with that bit set are put into one array (`shuffleIndexes1`) and the rest are put into another
     * (`shuffleIndexes0`). The two arrays are concatenated and used to shuffle the input array, using their values
     * (`shuffleIndex`) and the indexes of those values (`index`) in the concatenated array.
     *
     * Forward shuffling moves the entry at `shuffleIndex` to the `index` position.
     *
     * Reverse shuffling moves the entry at `index` to the `shuffleIndex` position.
     *
     * As each byte is moved, the bit at `bits[round]` is preserved in its original position. This ensures that the
     * process is reversible.
     *
     * @param bytes
     * Byte array.
     *
     * @param round
     * Round number.
     *
     * @param forward
     * True if operating forward (encrypting), false if operating in reverse (decrypting).
     *
     * @returns
     * Shuffled byte array.
     */
    private shuffle(bytes: Uint8Array, round: number, forward: boolean): Uint8Array {
        const bytesLength = bytes.length;

        const determinants = new Uint8Array(bytesLength);

        const shuffleIndexes1 = new Array<number>();
        const shuffleIndexes0 = new Array<number>();

        const bit = this._bits[round];

        bytes.forEach((byte, index) => {
            const determinant = byte & bit;

            determinants[index] = determinant;

            // Place byte in array chosen by bit state.
            (determinant !== 0 ? shuffleIndexes1 : shuffleIndexes0).push(index);
        });

        const inverseBit = this._inverseBits[round];

        const shuffleBytes = new Uint8Array(bytesLength);

        // Concatenate shuffle indexes arrays and complete shuffle.
        [...shuffleIndexes1, ...shuffleIndexes0].forEach((shuffleIndex, index) => {
            if (forward) {
                shuffleBytes[index] = (bytes[shuffleIndex] & inverseBit) | determinants[index];
            } else {
                shuffleBytes[shuffleIndex] = (bytes[index] & inverseBit) | determinants[shuffleIndex];
            }
        });

        return shuffleBytes;
    }

    /**
     * Xor a byte array.
     *
     * The input array to the forward operation (output from the reverse operation) is `bytes` and the output array from
     * the forward operation (input to the reverse operation) is `bytes'`.
     *
     * Forward:
     * - `bytes'[0] = bytes[0] ^ xorBytes[round]`
     * - `bytes'[1] = bytes[1] ^ bytes'[0]`
     * - `bytes'[2] = bytes[2] ^ bytes'[1]`
     * - `...`
     * - `bytes'[domainBytes - 1] = bytes[domainBytes - 1] ^ bytes'[domainBytes - 2]`
     *
     * Reverse:
     * - `bytes[0] = bytes'[0] ^ xorBytes[round]`
     * - `bytes[1] = bytes'[1] ^ bytes'[0]`
     * - `bytes[2] = bytes'[2] ^ bytes'[1]`
     * - `...`
     * - `bytes[domainBytes - 1] = bytes'[domainBytes - 1] ^ bytes'[domainBytes - 2]`
     *
     * @param bytes
     * Byte array.
     *
     * @param round
     * Round number.
     *
     * @param forward
     * True if operating forward (encrypting), false if operating in reverse (decrypting).
     *
     * @returns
     * Xored byte array.
     */
    private xor(bytes: Uint8Array, round: number, forward: boolean): Uint8Array {
        let cumulativeXorByte = this._xorBytes[round];

        return bytes.map((byte) => {
            const xorByte = byte ^ cumulativeXorByte;

            cumulativeXorByte = forward ? xorByte : byte;

            return xorByte;
        });
    }

    protected doForward(value: bigint): bigint {
        let bytes = this.valueToBytes(value);
        let transformedValue: bigint;

        // Loop repeats until transformed value is within domain.
        do {
            // Forward operation is shuffle then xor for the number of rounds.
            for (let round = 0; round < this._rounds; round++) {
                bytes = this.xor(this.shuffle(bytes, round, true), round, true);
            }

            transformedValue = EncryptionTransformer.bytesToValue(bytes);
        } while (transformedValue >= this.domain);

        return transformedValue;
    }

    protected doReverse(transformedValue: bigint): bigint {
        let bytes = this.valueToBytes(transformedValue);
        let value: bigint;

        // Loop repeats until value is within domain.
        do {
            // Reverse operation is xor then shuffle for the number of rounds in reverse.
            for (let round = this._rounds - 1; round >= 0; round--) {
                bytes = this.shuffle(this.xor(bytes, round, false), round, false);
            }

            value = EncryptionTransformer.bytesToValue(bytes);
        } while (value >= this.domain);

        return value;
    }
}
