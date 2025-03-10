export const localeStrings = {
    Transformer: {
        domainMustBeGreaterThanZero: "Le domaine {{domain, number}} doit être supérieur à 0",
        tweakMustBeGreaterThanOrEqualToZero: "Le réglage {{tweak, number}} doit être supérieur ou égal à 0",
        valueMustBeGreaterThanOrEqualToZero: "La valeur {{value, number}} doit être supérieure ou égale à 0",
        valueMustBeLessThan: "La valeur {{value, number}} doit être inférieure à {{domain, number}}",
        minimumValueMustBeGreaterThanOrEqualToZero: "La valeur minimale {{minimumValue, number}} doit être supérieure ou égale à 0",
        maximumValueMustBeLessThan: "La valeur maximale {{maximumValue, number}} doit être inférieure à {{domain, number}}"
    },
    RegExpValidator: {
        stringDoesNotMatchPattern: "La chaîne {{s}} ne correspond pas au modèle"
    },
    CharacterSetValidator: {
        firstZeroFirstCharacter: "Le jeu de caractères doit prendre en charge zéro comme premier caractère",
        allNumericAllNumericCharacters: "Le jeu de caractères doit prendre en charge tous les caractères numériques en séquence",
        stringMustNotBeAllNumeric: "La chaîne ne doit pas être entièrement numérique",
        lengthMustBeGreaterThanOrEqualTo: "La longueur {{length, number}} doit être supérieure ou égale à {{minimumLength, number}}",
        lengthMustBeLessThanOrEqualTo: "La longueur {{length, number}} doit être inférieure ou égale à {{maximumLength, number}}",
        lengthMustBeEqualTo: "La longueur {{length, number}} doit être égale à {{exactLength, number}}",
        lengthOfComponentMustBeGreaterThanOrEqualTo: "La longueur {{length, number}} de {{component}} doit être supérieure ou égale à {{minimumLength, number}}",
        lengthOfComponentMustBeLessThanOrEqualTo: "La longueur {{length, number}} de {{component}} doit être inférieure ou égale à {{maximumLength, number}}",
        lengthOfComponentMustBeEqualTo: "La longueur {{length, number}} de {{component}} doit être égale à {{exactLength, number}}",
        invalidCharacterAtPosition: "Caractère non valide '{{c}}' à la position {{position, number}}",
        invalidCharacterAtPositionOfComponent: "Caractère non valide '{{c}}' à la position {{position, number}} de {{component}}",
        exclusionNotSupported: "La valeur d'exclusion de {{exclusion, number}} n'est pas prise en charge",
        endSequenceValueMustBeLessThanOrEqualTo: "La valeur de la séquence de fin (valeur de la séquence de début + nombre - 1) doit être inférieure à {{domaine}}"
    },
    RecordValidator: {
        typeNameKeyNotFound: "{{typeName}} \"{{key}}\" introuvable"
    }
} as const;
