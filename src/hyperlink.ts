/**
 * Hyperlink.
 */
export interface Hyperlink {
    /**
     * Reference, relative or absolute depending on the application.
     */
    readonly reference: string;

    /**
     * Human-readable text.
     */
    readonly text?: string | undefined;

    /**
     * Additional details.
     */
    readonly details?: string | undefined;
}
