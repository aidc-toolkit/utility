import i18next, { utilityNS } from "./locale/i18n.js";
import type { StringValidator } from "./string.js";

/**
 * Record validator. Validation is performed against a record with a string key type and throws an exception if the key
 * is not found.
 */
export class RecordValidator<T> implements StringValidator {
    /**
     * Type name for error message.
     */
    private readonly _typeName: string;

    /**
     * Record in which to look up keys.
     */
    private readonly _record: Readonly<Record<string, T>>;

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
        this._typeName = typeName;
        this._record = record;
    }

    /**
     * Get the type name.
     */
    get typeName(): string {
        return this._typeName;
    }

    /**
     * Get the record.
     */
    get record(): Readonly<Record<string, T>> {
        return this._record;
    }

    /**
     * Validate a key by looking it up in the record.
     *
     * @param key
     * Record key.
     */
    validate(key: string): void {
        if (this.record[key] === undefined) {
            throw new RangeError(i18next.t("RecordValidator.typeNameKeyNotFound", {
                ns: utilityNS,
                typeName: this.typeName,
                key
            }));
        }
    }
}
