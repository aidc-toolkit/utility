export const localeStrings = {
    Transformer: {
        domainMustBeGreaterThanZero: "Domain {{domain, number}} must be greater than 0",
        tweakMustBeGreaterThanOrEqualToZero: "Tweak {{tweak, number}} must be greater than or equal to 0",
        valueMustBeGreaterThanOrEqualToZero: "Value {{value, number}} must be greater than or equal to 0",
        valueMustBeLessThan: "Value {{value, number}} must be less than {{domain, number}}",
        minimumValueMustBeGreaterThanOrEqualToZero: "Minimum value {{minimumValue, number}} must be greater than or equal to 0",
        maximumValueMustBeLessThan: "Maximum value {{maximumValue, number}} must be less than {{domain, number}}"
    },
    RegExpValidator: {
        stringDoesNotMatchPattern: "String {{s}} does not match pattern"
    },
    CharacterSetValidator: {
        firstZeroFirstCharacter: "Character set must support zero as first character",
        allNumericAllNumericCharacters: "Character set must support all numeric characters in sequence",
        stringMustNotBeAllNumeric: "String must not be all numeric",
        lengthMustBeGreaterThanOrEqualTo: "Length {{length, number}} must be greater than or equal to {{minimumLength, number}}",
        lengthMustBeLessThanOrEqualTo: "Length {{length, number}} must be less than or equal to {{maximumLength, number}}",
        lengthMustBeEqualTo: "Length {{length, number}} must be equal to {{exactLength, number}}",
        lengthOfComponentMustBeGreaterThanOrEqualTo: "Length {{length, number}} of {{component}} must be greater than or equal to {{minimumLength, number}}",
        lengthOfComponentMustBeLessThanOrEqualTo: "Length {{length, number}} of {{component}} must be less than or equal to {{maximumLength, number}}",
        lengthOfComponentMustBeEqualTo: "Length {{length, number}} of {{component}} must be equal to {{exactLength, number}}",
        invalidCharacterAtPosition: "Invalid character '{{c}}' at position {{position, number}}",
        invalidCharacterAtPositionOfComponent: "Invalid character '{{c}}' at position {{position, number}} of {{component}}",
        exclusionNotSupported: "Exclusion value of {{exclusion, number}} is not supported",
        endSequenceValueMustBeLessThanOrEqualTo: "End sequence value (start sequence value + count - 1) must be less than {{domain, number}}"
    },
    RecordValidator: {
        typeNameKeyNotFound: "{{typeName}} \"{{key}}\" not found"
    }
} as const;
