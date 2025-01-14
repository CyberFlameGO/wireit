/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ScriptStateString, ScriptReference} from '../script.js';
import type {RelativeEntry} from '../util/glob.js';

/**
 * Saves and restores output files to some cache store (e.g. local disk or
 * remote server).
 */
export interface Cache {
  /**
   * Check for a cache hit for the given script and cache key. Don't write it to
   * disk yet, instead return a {@link CacheHit} which can be used to control
   * when writing occurs.
   *
   * @param script The script whose output will be read from the cache.
   * @param cacheKey The string-encoded cache key for the script.
   * @return Promise of a {@link CacheHit} if there was an entry in the cache,
   * or undefined if there was not.
   */
  get(
    script: ScriptReference,
    cacheKey: ScriptStateString
  ): Promise<CacheHit | undefined>;

  /**
   * Write the given file paths to the cache if possible, keyed by the given
   * script and cache key.
   *
   * It is valid for an implementation to decide not to write to the cache and
   * return false, for example if the contents are too large.
   *
   * @param script The script whose output will be saved to the cache.
   * @param cacheKey The string-encoded cache key for the script.
   * @param relativeFiles The package-relative output files to cache.
   * @returns Whether the cache was written.
   */
  set(
    script: ScriptReference,
    cacheKey: ScriptStateString,
    relativeFiles: RelativeEntry[]
  ): Promise<boolean>;
}

/**
 * The result of {@link Cache.get}.
 *
 * Note the reason {@link Cache.get} reteurns this class instead of immediately
 * applying writing the cached output is so that the {@link Executor} can
 * control the timing of when cached output is written.
 */
export interface CacheHit {
  /**
   * Write the cached files to disk.
   *
   * It is assumed that any existing stale output has already been cleaned
   * before this method is called.
   */
  apply(): Promise<void>;
}
