export const localeStrings = {
    Transformer: {
        domainMustBeGreaterThanZero: "Le domaine {{domain}} doit être supérieur à 0",
        tweakMustBeGreaterThanOrEqualToZero: "Le réglage {{tweak}} doit être supérieur ou égal à 0",
        valueMustBeGreaterThanOrEqualToZero: "La valeur {{value}} doit être supérieure ou égale à 0",
        valueMustBeLessThan: "La valeur {{value}} doit être inférieure à {{domain}}",
        minValueMustBeGreaterThanOrEqualToZero: "La valeur minimale {{minValue}} doit être supérieure ou égale à 0",
        maxValueMustBeLessThan: "La valeur maximale {{maxValue}} doit être inférieure à {{domain}}"
    },
    RegExpValidator: {
        stringDoesNotMatchPattern: "La chaîne {{s}} ne correspond pas au modèle"
    },
    CharacterSetValidator: {
        firstZeroFirstCharacter: "Le jeu de caractères doit prendre en charge zéro comme premier caractère",
        allNumericAllNumericCharacters: "Le jeu de caractères doit prendre en charge tous les caractères numériques en séquence",
        stringMustNotBeAllNumeric: "La chaîne ne doit pas être entièrement numérique",
        lengthMustBeGreaterThanOrEqualTo: "La longueur {{length}} doit être supérieure ou égale à {{minimumLength}}",
        lengthMustBeLessThanOrEqualTo: "La longueur {{length}} doit être inférieure ou égale à {{maximumLength}}",
        lengthMustBeEqualTo: "La longueur {{length}} doit être égale à {{exactLength}}",
        lengthOfComponentMustBeGreaterThanOrEqualTo: "La longueur {{length}} de {{component}} doit être supérieure ou égale à {{minimumLength}}",
        lengthOfComponentMustBeLessThanOrEqualTo: "La longueur {{length}} de {{component}} doit être inférieure ou égale à {{maximumLength}}",
        lengthOfComponentMustBeEqualTo: "La longueur {{length}} de {{component}} doit être égale à {{exactLength}}",
        invalidCharacterAtPosition: "Caractère non valide '{{c}}' à la position {{position}}",
        invalidCharacterAtPositionOfComponent: "Caractère non valide '{{c}}' à la position {{position}} de {{component}}",
        exclusionNotSupported: "La valeur d'exclusion de {{exclusion}} n'est pas prise en charge",
        invalidTweakWithAllNumericExclusion: "Le réglage ne doit pas être utilisé avec une exclusion entièrement numérique",
        endSequenceValueMustBeLessThanOrEqualTo: "La valeur de la séquence de fin (valeur de la séquence de début + nombre - 1) doit être inférieure à {{domaine}}"
    },
    RecordValidator: {
        typeNameKeyNotFound: "{{typeName}} \"{{key}}\" introuvable"
    }
} as const;
