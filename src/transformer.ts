import { type IndexedCallback, mapIterable } from "./iterable-utility.js";
import { i18nextUtility } from "./locale/i18n.js";
import { Sequence } from "./sequence.js";

/**
 * Transformer primitive type.
 */
export type TransformerPrimitive = string | number | bigint | boolean;

/**
 * Transformer input type, one of:
 *
 * - TInput (primitive type)
 * - Iterable\<TInput\>
 *
 * @template TInput
 * Transformer input primitive type.
 */
export type TransformerInput<TInput extends TransformerPrimitive> = TInput | Iterable<TInput>;

/**
 * Transformer output, based on transformer input:
 *
 * - If type TTransformerInput is primitive, result is type TOutput.
 * - If type TTransformerInput is Iterable, result is type Iterable\<TOutput\>.
 *
 * @template TTransformerInput
 * Transformer input type.
 *
 * @template TOutput
 * Output base type.
 */
export type TransformerOutput<TTransformerInput extends TransformerInput<TransformerPrimitive>, TOutput> = TTransformerInput extends (TTransformerInput extends TransformerInput<infer TInput> ? TInput : never) ? TOutput : Iterable<TOutput>;

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
 * Two subclasses are supported directly by this class: {@linkcode IdentityTransformer} (which operates based on a
 * domain only) and {@linkcode EncryptionTransformer} (which operates based on a domain and a tweak). If an application
 * is expected to make repeated use of a transformer with the same domain and (optional) tweak and can't manage the
 * transformer object, an in-memory cache is available via the {@linkcode get | get()} method. Properties in {@linkcode
 * IdentityTransformer} and {@linkcode EncryptionTransformer} are read-only once constructed, so there is no issue with
 * their shared use.
 */
export abstract class Transformer {
    /**
     * Transformers cache, mapping a domain to another map, which maps an optional tweak to a transformer.
     */
    static readonly #TRANSFORMER_MAPS_MAP = new Map<bigint, Map<bigint | undefined, Transformer>>();

    /**
     * Domain.
     */
    readonly #domain: bigint;

    /**
     * Constructor.
     *
     * @param domain
     * Domain.
     */
    constructor(domain: number | bigint) {
        this.#domain = BigInt(domain);

        if (this.#domain <= 0n) {
            throw new RangeError(i18nextUtility.t("Transformer.domainMustBeGreaterThanZero", {
                domain
            }));
        }
    }

    /**
     * Get a transformer, constructing it if necessary. The type returned is {@linkcode IdentityTransformer} if tweak is
     * undefined, {@linkcode EncryptionTransformer} if tweak is defined. Note that although an {@linkcode
     * EncryptionTransformer} with a zero tweak operates as an {@linkcode IdentityTransformer}, {@linkcode
     * EncryptionTransformer} is still the type returned if a zero tweak is explicitly specified.
     *
     * @param domain
     * Domain.
     *
     * @param tweak
     * Tweak.
     *
     * @returns
     * {@linkcode IdentityTransformer} if tweak is undefined, {@linkcode EncryptionTransformer} if tweak is defined.
     */
    static get(domain: number | bigint, tweak?: number | bigint): Transformer {
        const domainN = BigInt(domain);

        let transformersMap = Transformer.#TRANSFORMER_MAPS_MAP.get(domainN);

        if (transformersMap === undefined) {
            transformersMap = new Map();
            Transformer.#TRANSFORMER_MAPS_MAP.set(domainN, transformersMap);
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
        return this.#domain;
    }

    /**
     * Validate that a value is within the domain.
     *
     * @param value
     * Value.
     */
    #validate(value: bigint): void {
        if (value < 0n) {
            throw new RangeError(i18nextUtility.t("Transformer.valueMustBeGreaterThanOrEqualToZero", {
                value
            }));
        }

        if (value >= this.domain) {
            throw new RangeError(i18nextUtility.t("Transformer.valueMustBeLessThan", {
                value,
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
     * Validate that a value is within the domain and do the work of transforming it forward.
     *
     * @param value
     * Value.
     *
     * @returns
     * Transformed value.
     */
    #validateDoForward(value: number | bigint): bigint {
        const valueN = BigInt(value);

        this.#validate(valueN);

        return this.doForward(valueN);
    }

    /**
     * Validate that a value is within the domain, do the work of transforming it forward, and apply a callback.
     *
     * @param transformerCallback
     * Called after each value is transformed to convert it to its final value.
     *
     * @param value
     * Value.
     *
     * @param index
     * Index in sequence (0 for single transformation).
     *
     * @returns
     * Transformed value.
     */
    #validateDoForwardCallback<TOutput>(transformerCallback: IndexedCallback<bigint, TOutput>, value: number | bigint, index?: number): TOutput {
        return transformerCallback(this.#validateDoForward(value), index);
    };

    /**
     * Transform value(s) forward.
     *
     * @template TTransformerInput
     * Value(s) input type.
     *
     * @param valueOrValues
     * Value(s). If this is an instance of {@linkcode Sequence}, the minimum and maximum values are validated prior to
     * transformation. Otherwise, the individual value(s) is/are validated at the time of transformation.
     *
     * @returns
     * Transformed value(s).
     */
    forward<TTransformerInput extends TransformerInput<number | bigint>>(valueOrValues: TTransformerInput): TransformerOutput<TTransformerInput, bigint>;

    /**
     * Transform value(s) forward, optionally applying a transformation.
     *
     * @template TTransformerInput
     * Value(s) input type.
     *
     * @template TOutput
     * Transformation callback output type.
     *
     * @param valueOrValues
     * Value(s). If this is an instance of {@linkcode Sequence}, the minimum and maximum values are validated prior to
     * transformation. Otherwise, the individual value(s) is/are validated at the time of transformation.
     *
     * @param transformerCallback
     * Called after each value is transformed to convert it to its final value.
     *
     * @returns
     * Transformed value(s).
     */
    forward<TTransformerInput extends TransformerInput<number | bigint>, TOutput>(valueOrValues: TTransformerInput, transformerCallback: IndexedCallback<bigint, TOutput>): TransformerOutput<TTransformerInput, TOutput>;

    // eslint-disable-next-line jsdoc/require-jsdoc -- Implementation of overloaded signatures.
    forward<TTransformerInput extends TransformerInput<number | bigint>, TOutput>(valueOrValues: TTransformerInput, transformerCallback?: IndexedCallback<bigint, TOutput>): TransformerOutput<TTransformerInput, TOutput> {
        // TODO Refactor type when https://github.com/microsoft/TypeScript/pull/56941 released.
        let result: bigint | TOutput | Iterable<bigint> | Iterable<TOutput>;

        if (typeof valueOrValues !== "object") {
            result = transformerCallback === undefined ? this.#validateDoForward(valueOrValues) : this.#validateDoForwardCallback(transformerCallback, valueOrValues);
        } else if (valueOrValues instanceof Sequence) {
            if (valueOrValues.minimumValue < 0n) {
                throw new RangeError(i18nextUtility.t("Transformer.minimumValueMustBeGreaterThanOrEqualToZero", {
                    minimumValue: valueOrValues.minimumValue
                }));
            }

            if (valueOrValues.maximumValue >= this.domain) {
                throw new RangeError(i18nextUtility.t("Transformer.maximumValueMustBeLessThan", {
                    maximumValue: valueOrValues.maximumValue,
                    domain: this.domain
                }));
            }

            result = transformerCallback === undefined ? mapIterable(valueOrValues, value => this.doForward(value)) : mapIterable(valueOrValues, (value, index) => transformerCallback(this.doForward(value), index));
        } else {
            result = transformerCallback === undefined ? mapIterable(valueOrValues, value => this.#validateDoForward(value)) : mapIterable(valueOrValues, (value, index) => this.#validateDoForwardCallback(transformerCallback, value, index));
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type determination is handled above.
        return result as TransformerOutput<TTransformerInput, TOutput>;
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
    reverse(transformedValue: number | bigint): bigint {
        const transformedValueN = BigInt(transformedValue);

        this.#validate(transformedValueN);

        return this.doReverse(transformedValueN);
    }
}

/**
 * Identity transformer. Values are transformed to themselves.
 */
export class IdentityTransformer extends Transformer {
    /**
     * @inheritDoc
     */
    protected doForward(value: bigint): bigint {
        return value;
    }

    /**
     * @inheritDoc
     */
    protected doReverse(transformedValue: bigint): bigint {
        return transformedValue;
    }
}

/**
 * Encryption transformer. Values are transformed using repeated shuffle and xor operations, similar to those found in
 * many cryptography algorithms, particularly AES. While sufficient for obfuscation of numeric sequences (e.g., serial
 * number generation, below), if true format-preserving encryption is required, a more robust algorithm such as {@link
 * https://doi.org/10.6028/NIST.SP.800-38Gr1.2pd | FF1} is recommended. Furthermore, no work has been done to mitigate
 * {@link https://timing.attacks.cr.yp.to/index.html | timing attacks} for key detection.
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
    static readonly #BITS = new Uint8Array([
        0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80
    ]);

    /**
     * Inverse individual bits, pre-calculated for performance.
     */
    static readonly #INVERSE_BITS = new Uint8Array([
        0xFE, 0xFD, 0xFB, 0xF7, 0xEF, 0xDF, 0xBF, 0x7F
    ]);

    /**
     * Number of bytes covered by the domain.
     */
    readonly #domainBytes: number;

    /**
     * Xor bytes array generated from the domain and tweak.
     */
    readonly #xorBytes: Uint8Array;

    /**
     * Bits array generated from the domain and tweak.
     */
    readonly #bits: Uint8Array;

    /**
     * Inverse bits array generated from the domain and tweak.
     */
    readonly #inverseBits: Uint8Array;

    /**
     * Number of rounds (length of arrays) generated from the domain and tweak.
     */
    readonly #rounds: number;

    /**
     * Constructor.
     *
     * @param domain
     * Domain.
     *
     * @param tweak
     * Tweak.
     */
    constructor(domain: number | bigint, tweak: number | bigint) {
        super(domain);

        if (tweak < 0n) {
            throw new RangeError(i18nextUtility.t("Transformer.tweakMustBeGreaterThanOrEqualToZero", {
                tweak
            }));
        }

        let domainBytes = 0;

        // The number of bytes in the domain determines the size of the shuffle and xor operations.
        for (let reducedDomainMinusOne = this.domain - 1n; reducedDomainMinusOne !== 0n; reducedDomainMinusOne >>= 8n) {
            domainBytes++;
        }

        this.#domainBytes = domainBytes;

        const xorBytes = new Array<number>();
        const bits = new Array<number>();
        const inverseBits = new Array<number>();

        // Key is the product of domain, tweak, and an 8-digit prime to force at least four rounds.
        for (let reducedKey = this.domain * BigInt(tweak) * 603868999n; reducedKey !== 0n; reducedKey >>= 8n) {
            // Extract the least significant byte.
            xorBytes.unshift(Number(BigInt.asUintN(8, reducedKey)));

            // Bit number is the reduced key mod 8.
            const bitNumber = Number(BigInt.asUintN(3, reducedKey));

            // Bits are applied in reverse order so that they don't correlate directly with the key bytes at the same index.
            bits.push(EncryptionTransformer.#BITS[bitNumber]);
            inverseBits.push(EncryptionTransformer.#INVERSE_BITS[bitNumber]);
        }

        // Domains occupying a single byte will not shuffle and will map all values to themselves for very small domains.
        if (domainBytes === 1) {
            // Determine the lowest possible mask that will cover all values in the domain.
            const domainMask = EncryptionTransformer.#BITS.filter(bit => bit < domain).reduce((accumulator, bit) => accumulator | bit, 0);

            // Reduce all xor bytes to a single byte and strip higher bits.
            this.#xorBytes = new Uint8Array([xorBytes.reduce((accumulator, xorByte) => accumulator ^ xorByte, 0) & domainMask]);

            // Bits and inverse bits are irrelevant as there will be no shuffling; choose first bit arbitrarily.
            this.#bits = new Uint8Array([EncryptionTransformer.#BITS[0]]);
            this.#inverseBits = new Uint8Array([EncryptionTransformer.#INVERSE_BITS[0]]);

            // Everything will be done in one round.
            this.#rounds = 1;
        } else {
            this.#xorBytes = new Uint8Array(xorBytes);
            this.#bits = new Uint8Array(bits);
            this.#inverseBits = new Uint8Array(inverseBits);
            this.#rounds = xorBytes.length;
        }
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
    #valueToBytes(value: bigint): Uint8Array {
        const bytes = new Uint8Array(this.#domainBytes);

        // Build byte array in reverse order to get as big-endian.
        for (let index = this.#domainBytes - 1, reducedValue = value; index >= 0 && reducedValue !== 0n; index--, reducedValue >>= 8n) {
            bytes[index] = Number(BigInt.asUintN(8, reducedValue));
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
    static #bytesToValue(bytes: Uint8Array): bigint {
        return bytes.reduce((accumulator, byte) => accumulator << 8n | BigInt(byte), 0n);
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
    #shuffle(bytes: Uint8Array, round: number, forward: boolean): Uint8Array {
        const bytesLength = bytes.length;

        const determinants = new Uint8Array(bytesLength);

        const shuffleIndexes1 = new Array<number>();
        const shuffleIndexes0 = new Array<number>();

        const bit = this.#bits[round];

        bytes.forEach((byte, index) => {
            const determinant = byte & bit;

            determinants[index] = determinant;

            // Place byte in array chosen by bit state.
            (determinant !== 0 ? shuffleIndexes1 : shuffleIndexes0).push(index);
        });

        const inverseBit = this.#inverseBits[round];

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
    #xor(bytes: Uint8Array, round: number, forward: boolean): Uint8Array {
        let cumulativeXorByte = this.#xorBytes[round];

        return bytes.map((byte) => {
            const xorByte = byte ^ cumulativeXorByte;

            cumulativeXorByte = forward ? xorByte : byte;

            return xorByte;
        });
    }

    /**
     * @inheritDoc
     */
    protected doForward(value: bigint): bigint {
        let bytes = this.#valueToBytes(value);
        let transformedValue: bigint;

        // Loop repeats until transformed value is within domain.
        do {
            // Forward operation is shuffle then xor for the number of rounds.
            for (let round = 0; round < this.#rounds; round++) {
                bytes = this.#xor(this.#shuffle(bytes, round, true), round, true);
            }

            transformedValue = EncryptionTransformer.#bytesToValue(bytes);
        } while (transformedValue >= this.domain);

        return transformedValue;
    }

    /**
     * @inheritDoc
     */
    protected doReverse(transformedValue: bigint): bigint {
        let bytes = this.#valueToBytes(transformedValue);
        let value: bigint;

        // Loop repeats until value is within domain.
        do {
            // Reverse operation is xor then shuffle for the number of rounds in reverse.
            for (let round = this.#rounds - 1; round >= 0; round--) {
                bytes = this.#shuffle(this.#xor(bytes, round, false), round, false);
            }

            value = EncryptionTransformer.#bytesToValue(bytes);
        } while (value >= this.domain);

        return value;
    }
}
