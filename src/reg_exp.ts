import i18next, { utilityNS } from "./locale/i18n.js";
import type { StringValidator } from "./string.js";

/**
 * Regular expression validator. The regular expression applies to the full string only if constructed as such. For
 * example, <code>&#x2F;\d&#x2A;&#x2F;</code> (0 or more digits) matches every string, <code>&#x2F;\d+&#x2F;</code>
 * (1 or more digits) matches strings with at least one digit, <code>&#x2F;^\d&#x2A;$&#x2F;</code> matches strings that
 * are all digits or empty, and <code>&#x2F;^\d+$&#x2F;</code> matches strings that are all digits and not empty.
 *
 * Clients of this class are recommended to override the {@link createErrorMessage} method create a more suitable error
 * message for their use case.
 */
export class RegExpValidator implements StringValidator {
    /**
     * Regular expression.
     */
    private readonly _regExp: RegExp;

    /**
     * Constructor.
     *
     * @param regExp
     * Regular expression. See {@link RegExpValidator | class documentation} for notes.
     */
    constructor(regExp: RegExp) {
        this._regExp = regExp;
    }

    /**
     * Get the regular expression.
     */
    get regExp(): RegExp {
        return this._regExp;
    }

    /**
     * Create an error message for a string. The generic error message is sufficient for many use cases but a more
     * domain-specific error message, possibly including the pattern itself, is often required.
     *
     * @param s
     * String.
     *
     * @returns
     * Error message.
     */
    protected createErrorMessage(s: string): string {
        return i18next.t("RegExpValidator.stringDoesNotMatchPattern", {
            ns: utilityNS,
            s
        });
    }

    validate(s: string): void {
        if (!this._regExp.test(s)) {
            throw new RangeError(this.createErrorMessage(s));
        }
    }
}
