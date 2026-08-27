/**
 * @file src/shared/lib/navigation.ts
 * @module shared/lib/navigation
 *
 * @architecture Navigation & Go Specification Routing Architecture
 * @description Centralized navigation dispatcher for handling anchor hash redirects,
 * specification manual links, and event delegation for Go Runtime primitives.
 *
 * @see {@link https://github.com/golang/go/tree/master/src/runtime Go Runtime Source Code}
 */

/**
 * Format string template for specification hash navigation.
 * Internal pattern: `#docs#<primitive_id>`
 */
const SPEC_HASH_PREFIX = '#docs#' as const;

/** ANCHOR: SPEC_NAVIGATION_DISPATCHER */
/**
 * Dispatches navigation to the runtime specification panel for a specified primitive.
 * Prevents default event behavior and constructs the normalized target hash URL.
 *
 * @remarks
 * Normalizes primitive IDs by trimming whitespace and building the standard `#docs#<id>` hash.
 * Safely fallbacks if the execution context lacks window location references.
 *
 * @param event - The trigger MouseEvent from the UI interaction.
 * @param primitiveId - Unique identifier of the Go Runtime primitive (e.g., 'sudog', 'g', 'm', 'p', 'hchan').
 * @returns Void
 *
 * @example
 * ```tsx
 * <button onclick={(e) => navigateToSpec(e, 'sudog')}>View sudog Spec</button>
 * ```
 */
export function navigateToSpec(event: MouseEvent, primitiveId: string): void {
  event.preventDefault();

  if (!primitiveId || typeof window === 'undefined') {
    return;
  }

  const cleanId = primitiveId.trim().replace(/^#docs#/, '');
  const targetHash = `${SPEC_HASH_PREFIX}${cleanId}`;

  window.location.hash = targetHash;
}
