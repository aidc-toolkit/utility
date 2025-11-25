/**
 * Exclusion options for validating and creating strings based on character sets.
 */
export const Exclusions = {
    /**
     * No strings excluded.
     */
    None: 0,

    /**
     * Strings that start with zero ('0') excluded.
     */
    FirstZero: 1,

    /**
     * Strings that are all-numeric (e.g., "123456") excluded.
     */
    AllNumeric: 2
} as const;

/**
 * Exclusion.
 */
export type Exclusion = typeof Exclusions[keyof typeof Exclusions];
