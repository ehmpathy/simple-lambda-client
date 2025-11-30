import type { SimpleCache } from 'with-simple-cache';

/**
 * disable the `.set` functionality of a cache
 *
 * usecases
 * - when a cache is owned by a lambda.service
 *   - you can `.get` from the cache to avoid the lambda.api.call, given the cache key is serialized via `getSimpleLambdaClientCacheKey`
 *   - you shouldn't `.set` to the cache though, since the lambda.service is responsible for managing the data persisted there
 */
export const withoutSet = <T>(cache: SimpleCache<T>): SimpleCache<T> =>
  ({
    ...cache,
    set: (() => {}) as SimpleCache<T>['set'],
  }) as SimpleCache<T>;
