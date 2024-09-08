export const localeStrings = {
    Transformer: {
        domainMustBeGreaterThanZero: "Domain {{domain}} must be greater than 0",
        tweakMustBeGreaterThanOrEqualToZero: "Tweak {{tweak}} must be greater than or equal to 0",
        valueMustBeGreaterThanOrEqualToZero: "Value {{startValue}} must be greater than or equal to 0",
        startValueMustBeGreaterThanOrEqualToZero: "Start value {{startValue}} must be greater than or equal to 0",
        valueMustBeLessThan: "Value {{endValue}} must be less than {{domain}}",
        endValueMustBeLessThan: "End value (start value + count - 1) {{endValue}} must be less than {{domain}}"
    },
    RegExpValidator: {
        stringDoesNotMatchPattern: "String {{s}} does not match pattern"
    },
    CharacterSetValidator: {
        stringMustNotBeAllNumeric: "String must not be all numeric",
        lengthMustBeGreaterThanOrEqualTo: "Length {{length}} must be greater than or equal to {{minimumLength}}",
        lengthMustBeLessThanOrEqualTo: "Length {{length}} must be less than or equal to {{maximumLength}}",
        lengthMustBeEqualTo: "Length {{length}} must be equal to {{exactLength}}",
        lengthOfComponentMustBeGreaterThanOrEqualTo: "Length {{length}} of {{component}} must be greater than or equal to {{minimumLength}}",
        lengthOfComponentMustBeLessThanOrEqualTo: "Length {{length}} of {{component}} must be less than or equal to {{maximumLength}}",
        lengthOfComponentMustBeEqualTo: "Length {{length}} of {{component}} must be equal to {{exactLength}}",
        invalidCharacterAtPosition: "Invalid character '{{c}}' at position {{position}}",
        invalidCharacterAtPositionOfComponent: "Invalid character '{{c}}' at position {{position}} of {{component}}",
        exclusionNotSupported: "Exclusion value of {{exclusion}} is not supported",
        invalidTweakWithAllNumericExclusion: "Tweak must not be used with all-numeric exclusion",
        endSequenceValueMustBeLessThanOrEqualTo: "End sequence value (start sequence value + count - 1) must be less than {{domain}}"
    },
    RecordValidator: {
        typeNameKeyNotFound: "{{typeName}} \"{{key}}\" not found"
    }
} as const;
