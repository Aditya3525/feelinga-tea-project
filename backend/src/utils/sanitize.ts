/**
 * Escape special regex characters in a string to prevent ReDoS attacks.
 * Use this whenever user input is used in `new RegExp(...)`.
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
