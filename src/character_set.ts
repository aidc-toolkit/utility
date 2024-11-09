import i18next, { utilityNS } from "./locale/i18n.js";
import { RegExpValidator } from "./reg_exp.js";
import type { StringValidation, StringValidator } from "./string.js";
import { Transformer } from "./transformer.js";

/**
 * Exclusion options for validating and creating strings based on character sets.
 */
export enum Exclusion {
    /**
     * No strings excluded.
     */
    None,

    /**
     * Strings that start with zero ('0') excluded.
     */
    FirstZero,

    /**
     * Strings that are all-numeric (e.g., "123456") excluded.
     */
    AllNumeric
}

/**
 * Character set validation parameters.
 */
export interface CharacterSetValidation extends StringValidation {
    /**
     * Minimum length. If defined and the string is less than this length, an error is thrown.
     */
    minimumLength?: number | undefined;

    /**
     * Maximum length. If defined and the string is greater than this length, an error is thrown.
     */
    maximumLength?: number | undefined;

    /**
     * Exclusion from the string. If defined and the string is within the exclusion range, an error is thrown.
     */
    exclusion?: Exclusion | undefined;

    /**
     * Position offset within a larger string. Strings are sometimes composed of multiple substrings; this parameter
     * ensures that the error notes the proper position in the string.
     */
    positionOffset?: number | undefined;

    /**
     * Name of component, typically but not exclusively within a larger string. This parameter ensure that the
     * error notes the component that triggered it. Value may be a string or a callback that returns a string, the
     * latter allowing for localization changes.
     */
    component?: string | (() => string) | undefined;
}

/**
 * Character set validator. Validates a string against a specified character set.
 */
export class CharacterSetValidator implements StringValidator<CharacterSetValidation> {
    private static readonly NOT_ALL_NUMERIC_VALIDATOR = new class extends RegExpValidator {
        /**
         * Create an error message for an all-numeric string.
         *
         * @param _s
         * String.
         *
         * @returns
         * Error message.
         */
        protected override createErrorMessage(_s: string): string {
            return i18next.t("CharacterSetValidator.stringMustNotBeAllNumeric", {
                ns: utilityNS
            });
        }
    }(/\D/);

    /**
     * Character set.
     */
    private readonly _characterSet: readonly string[];

    /**
     * Character set map, mapping each character in the character set to its index such that
     * `_characterSetMap.get(_characterSet[index]) === index`.
     */
    private readonly _characterSetMap: Map<string, number>;

    /**
     * Exclusions supported by the character set.
     */
    private readonly _exclusionSupport: readonly Exclusion[];

    /**
     * Constructor.
     *
     * @param characterSet
     * Character set. Each element is a single-character string, unique within the array, that defines the character
     * set.
     *
     * @param exclusionSupport
     * Exclusions supported by the character set. All character sets implicitly support {@link Exclusion.None}.
     */
    constructor(characterSet: readonly string[], ...exclusionSupport: readonly Exclusion[]) {
        this._characterSet = characterSet;

        this._characterSetMap = new Map(characterSet.map((c, index) => [c, index]));

        this._exclusionSupport = exclusionSupport;
    }

    /**
     * Get the character set.
     */
    get characterSet(): readonly string[] {
        return this._characterSet;
    }

    /**
     * Get the character set size.
     */
    get characterSetSize(): number {
        return this._characterSet.length;
    }

    /**
     * Get the exclusions supported by the character set.
     */
    get exclusionSupport(): readonly Exclusion[] {
        return this._exclusionSupport;
    }

    /**
     * Get the character at an index.
     *
     * @param index
     * Index into the character set.
     *
     * @returns
     * Character at the index.
     */
    character(index: number): string {
        return this._characterSet[index];
    }

    /**
     * Get the index for a character.
     *
     * @param c
     * Character.
     *
     * @returns
     * Index for the character or undefined if the character is not in the character set.
     */
    characterIndex(c: string): number | undefined {
        return this._characterSetMap.get(c);
    }

    /**
     * Get the indexes for all characters in a string.
     *
     * @param s
     * String.
     *
     * @returns
     * Array of indexes for each character or undefined if the character is not in the character set.
     */
    characterIndexes(s: string): ReadonlyArray<number | undefined> {
        return [...s].map(c => this._characterSetMap.get(c));
    }

    /**
     * Convert a component definition to a string or undefined. Checks the type of the component and makes the callback
     * if required.
     *
     * @param component
     * Component definition as a string, callback, or undefined.
     *
     * @returns
     * Component as a string or undefined.
     */
    private static componentToString(component: string | (() => string) | undefined): string | undefined {
        return typeof component === "function" ? component() : component;
    }

    /**
     * Validate that an exclusion is supported. If not, an error is thrown.
     *
     * @param exclusion
     * Exclusion.
     */
    protected validateExclusion(exclusion: Exclusion): void {
        if (exclusion !== Exclusion.None && !this._exclusionSupport.includes(exclusion)) {
            throw new RangeError(i18next.t("CharacterSetValidator.exclusionNotSupported", {
                ns: utilityNS,
                exclusion
            }));
        }
    }

    /**
     * Validate a string. If the string violates the character set or any of the character set validation parameters, an
     * error is thrown.
     *
     * @param s
     * String.
     *
     * @param validation
     * Character set validation parameters.
     */
    validate(s: string, validation?: CharacterSetValidation): void {
        const length = s.length;

        const minimumLength = validation?.minimumLength;
        const maximumLength = validation?.maximumLength;

        if (minimumLength !== undefined && length < minimumLength) {
            let errorMessage: string;

            if (maximumLength !== undefined && maximumLength === minimumLength) {
                errorMessage = i18next.t(validation?.component === undefined ? "CharacterSetValidator.lengthMustBeEqualTo" : "CharacterSetValidator.lengthOfComponentMustBeEqualTo", {
                    ns: utilityNS,
                    component: CharacterSetValidator.componentToString(validation?.component),
                    length,
                    exactLength: minimumLength
                });
            } else {
                errorMessage = i18next.t(validation?.component === undefined ? "CharacterSetValidator.lengthMustBeGreaterThanOrEqualTo" : "CharacterSetValidator.lengthOfComponentMustBeGreaterThanOrEqualTo", {
                    ns: utilityNS,
                    component: CharacterSetValidator.componentToString(validation?.component),
                    length,
                    minimumLength
                });
            }

            throw new RangeError(errorMessage);
        }

        if (maximumLength !== undefined && length > maximumLength) {
            throw new RangeError(i18next.t(validation?.component === undefined ? "CharacterSetValidator.lengthMustBeLessThanOrEqualTo" : "CharacterSetValidator.lengthOfComponentMustBeLessThanOrEqualTo", {
                ns: utilityNS,
                component: CharacterSetValidator.componentToString(validation?.component),
                length,
                maximumLength
            }));
        }

        // Find the index of the first character that is not in the character set.
        const index = this.characterIndexes(s).findIndex(characterIndex => characterIndex === undefined);

        if (index !== -1) {
            throw new RangeError(i18next.t(validation?.component === undefined ? "CharacterSetValidator.invalidCharacterAtPosition" : "CharacterSetValidator.invalidCharacterAtPositionOfComponent", {
                ns: utilityNS,
                component: CharacterSetValidator.componentToString(validation?.component),
                c: s.charAt(index),
                position: index + (validation?.positionOffset ?? 0) + 1
            }));
        }

        if (validation?.exclusion !== undefined) {
            this.validateExclusion(validation.exclusion);

            switch (validation.exclusion) {
                case Exclusion.FirstZero:
                    if (s.startsWith("0")) {
                        throw new RangeError(i18next.t(validation.component === undefined ? "CharacterSetValidator.invalidCharacterAtPosition" : "CharacterSetValidator.invalidCharacterAtPositionOfComponent", {
                            ns: utilityNS,
                            component: CharacterSetValidator.componentToString(validation.component),
                            c: "0",
                            position: (validation.positionOffset ?? 0) + 1
                        }));
                    }
                    break;

                case Exclusion.AllNumeric:
                    CharacterSetValidator.NOT_ALL_NUMERIC_VALIDATOR.validate(s);
                    break;
            }
        }
    }
}

/**
 * Creation callback, used to convert created string to its final value.
 *
 * @param s
 * Created string.
 *
 * @param index
 * Index in sequence creation (0 for single creation).
 *
 * @returns
 * Final value.
 */
export type CreationCallback = (s: string, index: number) => string;

/**
 * Character set creator. Maps numeric values to strings using the character set as digits.
 */
export class CharacterSetCreator extends CharacterSetValidator {
    /**
     * Maximum string length supported.
     */
    static readonly MAXIMUM_STRING_LENGTH = 40;

    /**
     * Powers of 10 from 1 (`10**0`) to `10**MAXIMUM_STRING_LENGTH`.
     */
    private static readonly _powersOf10: readonly bigint[] = CharacterSetCreator.createPowersOf(10);

    /**
     * Create powers of a given base from 1 (`base**0`) to `base**MAXIMUM_STRING_LENGTH`.
     *
     * @param base
     * Number base.
     *
     * @returns
     * Array of powers of base.
     */
    private static createPowersOf(base: number): readonly bigint[] {
        const powersOf = new Array<bigint>(this.MAXIMUM_STRING_LENGTH + 1);

        const baseN = BigInt(base);

        for (let index = 0, powerOf = 1n; index <= this.MAXIMUM_STRING_LENGTH; index++, powerOf *= baseN) {
            powersOf[index] = powerOf;
        }

        return powersOf;
    }

    /**
     * Get a power of 10.
     *
     * @param power
     * Power.
     *
     * @returns
     * `10**power`.
     */
    static powerOf10(power: number): bigint {
        return this._powersOf10[power];
    }

    /**
     * Character set size as big integer, cached for performance purposes.
     */
    private readonly _characterSetSizeN: bigint;

    /**
     * Character set size minus 1 as big integer, cached for performance purposes.
     */
    private readonly _characterSetSizeMinusOneN: bigint;

    /**
     * Domains for every length for every supported {@link Exclusion}.
     */
    private readonly _exclusionDomains: ReadonlyArray<readonly bigint[]>;

    /**
     * Values that would generate all zeros in the created string.
     */
    private readonly _allZerosValues: readonly bigint[];

    /**
     * Constructor.
     *
     * @param characterSet
     * Character set. Each element is a single-character string, unique within the array, that defines the character
     * set.
     *
     * @param exclusionSupport
     * Exclusions supported by the character set. All character sets implicitly support {@link Exclusion.None}.
     */
    constructor(characterSet: readonly string[], ...exclusionSupport: readonly Exclusion[]) {
        super(characterSet, ...exclusionSupport);

        this._characterSetSizeN = BigInt(this.characterSetSize);
        this._characterSetSizeMinusOneN = BigInt(this.characterSetSize - 1);

        const exclusionDomains: Array<readonly bigint[]> = [];

        const exclusionNoneDomains = CharacterSetCreator.createPowersOf(this.characterSetSize);

        exclusionDomains[Exclusion.None] = exclusionNoneDomains;

        if (exclusionSupport.includes(Exclusion.FirstZero)) {
            if (characterSet[0] !== "0") {
                throw new RangeError(i18next.t("CharacterSetValidator.firstZeroFirstCharacter", {
                    ns: utilityNS
                }));
            }

            const exclusionFirstZeroDomains = new Array<bigint>(CharacterSetCreator.MAXIMUM_STRING_LENGTH + 1);

            // Exclusion of first zero mathematically prohibits length of 0.
            exclusionFirstZeroDomains[0] = 0n;

            for (let index = 1; index <= CharacterSetCreator.MAXIMUM_STRING_LENGTH; index++) {
                // Domain excludes zero as the first character and so works with previous exclusion none domain.
                exclusionFirstZeroDomains[index] = this._characterSetSizeMinusOneN * exclusionNoneDomains[index - 1];
            }

            exclusionDomains[Exclusion.FirstZero] = exclusionFirstZeroDomains;
        }

        if (exclusionSupport.includes(Exclusion.AllNumeric)) {
            const exclusionAllNumericDomains = new Array<bigint>(CharacterSetCreator.MAXIMUM_STRING_LENGTH + 1);

            const numberIndexes = this.characterIndexes("0123456789");

            let expectedNumberIndex = numberIndexes[0];

            // Make sure that all numeric characters are present and in sequence.
            for (const numberIndex of numberIndexes) {
                if (numberIndex === undefined || numberIndex !== expectedNumberIndex) {
                    throw new RangeError(i18next.t("CharacterSetValidator.allNumericAllNumericCharacters", {
                        ns: utilityNS
                    }));
                }

                expectedNumberIndex = numberIndex + 1;
            }

            // Zero index is the all-zero value for a single-character string.
            const zeroIndex = BigInt((numberIndexes as number[])[0]);

            const allZerosValues = new Array<bigint>(CharacterSetCreator.MAXIMUM_STRING_LENGTH + 1);
            let allZerosValue = 0n;

            // Each all-zero value is the previous all-zero value multiplied by the character set size plus the zero index.
            for (let index = 0; index <= CharacterSetCreator.MAXIMUM_STRING_LENGTH; index++) {
                // Domain excludes the number of permutations that would result in an all-numeric string.
                exclusionAllNumericDomains[index] = exclusionNoneDomains[index] - CharacterSetCreator.powerOf10(index);

                allZerosValues[index] = allZerosValue;

                allZerosValue = allZerosValue * this._characterSetSizeN + zeroIndex;
            }

            this._allZerosValues = allZerosValues;

            exclusionDomains[Exclusion.AllNumeric] = exclusionAllNumericDomains;
        } else {
            // Empty array obviates need for non-null assertion while still forcing error if indexed due to a bug.
            this._allZerosValues = [];
        }

        this._exclusionDomains = exclusionDomains;
    }

    /**
     * Get a power of character set size.
     *
     * @param power
     * Power.
     *
     * @returns
     * `characterSetSize**power`.
     */
    private powerOfSize(power: number): bigint {
        return this._exclusionDomains[Exclusion.None][power];
    }

    /**
     * Determine the shift required to skip all all-numeric strings up to the value.
     *
     * @param shiftForward
     * True to shift forward (value to string), false to shift backward (string to value).
     *
     * @param length
     * Length of string for which to get the all-numeric shift.
     *
     * @param value
     * Value for which to get the all-numeric shift.
     *
     * @returns
     * Shift required to skip all all-numeric strings.
     */
    private allNumericShift(shiftForward: boolean, length: number, value: bigint): bigint {
        let shift: bigint;

        if (length === 0) {
            if (!shiftForward && value < 10n) {
                // If calculation gets this far, string is all-numeric.
                throw new RangeError(i18next.t("CharacterSetValidator.stringMustNotBeAllNumeric", {
                    ns: utilityNS
                }));
            }

            // Now dealing with individual characters; shift by 10 to skip numeric characters.
            shift = 10n;
        } else {
            const powerOfSize = this.powerOfSize(length);
            const powerOf10 = CharacterSetCreator.powerOf10(length);

            // Calculate the gap to the next numeric string of equal length with incremental first character.
            const gap = shiftForward ? powerOfSize - powerOf10 : powerOfSize;

            // Determine the number of gaps remaining in the value.
            const gaps = value / gap;

            if (gaps >= 10n) {
                // Shift is the next power of 10.
                shift = CharacterSetCreator.powerOf10(length + 1);
            } else {
                // Shift is the number of gaps times the current power of 10 plus the shift for the next length down with value adjusted by the number of gaps times the gap.
                shift = gaps * powerOf10 + this.allNumericShift(shiftForward, length - 1, value - gaps * gap);
            }
        }

        return shift;
    }

    /**
     * Validate that a length is less than or equal to {@link MAXIMUM_STRING_LENGTH}. If not, an error is thrown.
     *
     * @param length
     * Length.
     */
    private validateLength(length: number): void {
        if (length < 0) {
            throw new RangeError(i18next.t("CharacterSetValidator.lengthMustBeGreaterThanOrEqualTo", {
                ns: utilityNS,
                length,
                minimumLength: 0
            }));
        }

        if (length > CharacterSetCreator.MAXIMUM_STRING_LENGTH) {
            throw new RangeError(i18next.t("CharacterSetValidator.lengthMustBeLessThanOrEqualTo", {
                ns: utilityNS,
                length,
                maximumLength: CharacterSetCreator.MAXIMUM_STRING_LENGTH
            }));
        }
    }

    /**
     * Create a string by mapping a value to the equivalent characters in the character set across the length of the
     * string.
     *
     * @param length
     * Required string length.
     *
     * @param value
     * Numeric value of the string.
     *
     * @param exclusion
     * Strings to be excluded from the range of outputs. See {@link Exclusion} for possible values and their meaning.
     *
     * @param tweak
     * If provided, the numerical value of the string is "tweaked" using an {@link EncryptionTransformer | encryption
     * transformer}.
     *
     * @param creationCallback
     * If provided, called after the string is constructed to create the final value.
     *
     * @returns
     * String created from the value.
     */
    create(length: number, value: number | bigint, exclusion?: Exclusion, tweak?: number | bigint, creationCallback?: CreationCallback): string;

    /**
     * Create multiple strings by mapping each value to the equivalent characters in the character set across the length
     * of the string. Equivalent to calling this method for each individual value.
     *
     * @param length
     * Required string length.
     *
     * @param values
     * Numeric values of the strings.
     *
     * @param exclusion
     * Strings to be excluded from the range of outputs. See {@link Exclusion} for possible values and their meaning.
     *
     * @param tweak
     * If provided, the numerical value of the strings are "tweaked" using an {@link EncryptionTransformer | encryption
     * transformer}.
     *
     * @param creationCallback
     * If provided, called after each string is constructed to create the final value.
     *
     * @returns
     * Iterable iterator over strings created from the values.
     */
    create(length: number, values: Iterable<number | bigint>, exclusion?: Exclusion, tweak?: number | bigint, creationCallback?: CreationCallback): IterableIterator<string>;

    /**
     * Create a string or multiple strings. This signature exists to allow similar overloaded methods in other classes
     * to call this method correctly.
     *
     * @param length
     *
     * @param valueOrValues
     *
     * @param exclusion
     *
     * @param tweak
     *
     * @param creationCallback
     *
     * @returns
     */
    create(length: number, valueOrValues: number | bigint | Iterable<number | bigint>, exclusion?: Exclusion, tweak?: number | bigint, creationCallback?: CreationCallback): string | IterableIterator<string>;

    // eslint-disable-next-line jsdoc/require-jsdoc -- Implementation of overloaded signatures.
    create(length: number, valueOrValues: number | bigint | Iterable<number | bigint>, exclusion: Exclusion = Exclusion.None, tweak?: number | bigint, creationCallback?: CreationCallback): string | IterableIterator<string> {
        this.validateLength(length);
        this.validateExclusion(exclusion);

        // Zero value obviates need for non-null assertion.
        const allZerosValue = exclusion === Exclusion.AllNumeric ? this._allZerosValues[length] : 0n;

        const transformer = Transformer.get(this._exclusionDomains[exclusion][length], tweak);

        return transformer.forward(valueOrValues, (transformedValue, index) => {
            let s = "";

            // Empty string is valid.
            if (length !== 0) {
                let convertValue = transformedValue;

                if (exclusion === Exclusion.AllNumeric && convertValue >= allZerosValue) {
                    // Value to convert is shifted by the number of all-numeric strings that occur at or prior to it.
                    convertValue = convertValue + this.allNumericShift(true, length, convertValue - allZerosValue);
                }

                // Build string from right to left excluding the first character.
                for (let position = length - 1; position > 0; position--) {
                    const nextConvertValue = convertValue / this._characterSetSizeN;

                    // First step is effectively a modulus calculation.
                    s = this.character(Number(convertValue - nextConvertValue * this._characterSetSizeN)) + s;

                    convertValue = nextConvertValue;
                }

                // Zero is first in the character set for those that support excluding first zero.
                s = this.character(exclusion === Exclusion.FirstZero ? Number(convertValue % this._characterSetSizeMinusOneN) + 1 : Number(convertValue % this._characterSetSizeN)) + s;
            }

            return creationCallback !== undefined ? creationCallback(s, index) : s;
        });
    }

    /**
     * Determine the value for a string.
     *
     * @param s
     * String.
     *
     * @param exclusion
     * Strings excluded from the range of inputs. See {@link Exclusion} for possible values and their meaning.
     *
     * @param tweak
     * If provided, the numerical value of the string was "tweaked" using an {@link EncryptionTransformer | encryption
     * transformer}.
     *
     * @returns
     * Numeric value of the string.
     */
    valueFor(s: string, exclusion: Exclusion = Exclusion.None, tweak?: number | bigint): bigint {
        const length = s.length;

        this.validateLength(length);
        this.validateExclusion(exclusion);

        const characterSetSizeN = BigInt(this.characterSetSize);

        // Convert string to its value character by character.
        let value = this.characterIndexes(s).reduce((accumulator, characterIndex, index) => {
            if (characterIndex === undefined) {
                throw new RangeError(i18next.t("CharacterSetValidator.invalidCharacterAtPosition", {
                    ns: utilityNS,
                    c: s.charAt(index),
                    position: index + 1
                }));
            }

            let value: bigint;

            if (index === 0 && exclusion === Exclusion.FirstZero) {
                if (characterIndex === 0) {
                    throw new RangeError(i18next.t("CharacterSetValidator.invalidCharacterAtPosition", {
                        ns: utilityNS,
                        c: "0",
                        position: 1
                    }));
                }

                // Accumulator is known to be zero at this point.
                value = BigInt(characterIndex - 1);
            } else {
                value = accumulator * characterSetSizeN + BigInt(characterIndex);
            }

            return value;
        }, 0n);

        if (exclusion === Exclusion.AllNumeric) {
            const allZerosValue = this._allZerosValues[length];

            if (value >= allZerosValue) {
                // Call will ensure that string is not all-numeric.
                value -= this.allNumericShift(false, length, value - allZerosValue);
            }
        }

        return Transformer.get(this._exclusionDomains[exclusion][length], tweak).reverse(value);
    }
}

/**
 * Numeric creator. Character set is 0-9. Supports {@link Exclusion.FirstZero}.
 */
export const NUMERIC_CREATOR = new CharacterSetCreator([
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
], Exclusion.FirstZero);

/**
 * Hexadecimal creator. Character set is 0-9, A-F. Supports {@link Exclusion.FirstZero} and {@link
 * Exclusion.AllNumeric}.
 */
export const HEXADECIMAL_CREATOR = new CharacterSetCreator([
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "A", "B", "C", "D", "E", "F"
], Exclusion.FirstZero, Exclusion.AllNumeric);

/**
 * Alphabetic creator. Character set is A-Z.
 */
export const ALPHABETIC_CREATOR = new CharacterSetCreator([
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
]);

/**
 * Alphanumeric creator. Character set is 0-9, A-Z. Supports {@link Exclusion.FirstZero} and {@link
 * Exclusion.AllNumeric}.
 */
export const ALPHANUMERIC_CREATOR = new CharacterSetCreator([
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
], Exclusion.FirstZero, Exclusion.AllNumeric);
