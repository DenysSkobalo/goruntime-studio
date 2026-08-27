/**
 * @file src/shared/config/links.ts
 * @module shared/config/links
 *
 * @architecture External Source & Specification Links Configuration
 * @description Constants defining GitHub deep links pointing to official Go runtime source code files
 * (`runtime2.go`, `chan.go`) for inspectable primitives.
 */

/**
 * Deep links object pointing to official Go runtime source code lines on GitHub.
 * ANCHOR: GO_RUNTIME_LINKS_CONFIG
 */
export const GO_RUNTIME_LINKS = {
  /** GitHub link targeting `runtime.g` struct declaration in `runtime2.go`. */
  GOROUTINE_SPEC: 'https://github.com/golang/go/blob/master/src/runtime/runtime2.go#L471',
  /** GitHub link targeting `runtime.hchan` struct declaration in `chan.go`. */
  CHANNEL_SPEC: 'https://github.com/golang/go/blob/master/src/runtime/chan.go#L34',
  /** GitHub link targeting `runtime.sudog` struct declaration in `runtime2.go`. */
  SUDOG_SPEC: 'https://github.com/golang/go/blob/master/src/runtime/runtime2.go#L404',
} as const;
