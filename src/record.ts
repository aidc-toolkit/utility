import { i18nextUtility } from "./locale/i18n.js";
import type { StringValidator } from "./string.js";

/**
 * Record validator. Validation is performed against a record with a string key type and throws an error if the key is
 * not found.
 *
 * @template T
 * Property type.
 */
export class RecordValidator<T> implements StringValidator {
    /**
     * Type name for error message.
     */
    readonly #typeName: string;

    /**
     * Record in which to look up keys.
     */
    readonly #record: Readonly<Record<string, T>>;

    /**
     * Constructor.
     *
     * @param typeName
     * Type name for error message.
     *
     * @param record
     * Record in which to look up keys.
     */
    constructor(typeName: string, record: Readonly<Record<string, T>>) {
        this.#typeName = typeName;
        this.#record = record;
    }

    /**
     * Get the type name.
     */
    get typeName(): string {
        return this.#typeName;
    }

    /**
     * Get the record.
     */
    get record(): Readonly<Record<string, T>> {
        return this.#record;
    }

    /**
     * Validate a key by looking it up in the record.
     *
     * @param key
     * Record key.
     */
    validate(key: string): void {
        if (!(key in this.record)) {
            throw new RangeError(i18nextUtility.t("RecordValidator.typeNameKeyNotFound", {
                typeName: this.typeName,
                key
            }));
        }
    }
}
