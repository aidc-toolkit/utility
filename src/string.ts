/**
 * String validation interface. To ensure signature compatibility in implementing classes, string validation is
 * controlled by validation interfaces specific to each validator type.
 */
export interface StringValidation {
}

/**
 * String validator interface.
 *
 * @template TStringValidation
 * String validation type.
 */
export interface StringValidator<TStringValidation extends StringValidation = StringValidation> {
    /**
     * Validate a string and throw an error if validation fails.
     *
     * @param s
     * String.
     *
     * @param validation
     * String validation parameters.
     */
    validate: (s: string, validation?: TStringValidation) => void;
}
