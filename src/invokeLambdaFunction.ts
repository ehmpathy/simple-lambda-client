import { createCache } from 'simple-in-memory-cache';
import { SimpleCache, withSimpleCachingAsync } from 'with-simple-caching';

import { getSimpleLambdaClientCacheKey } from './cache/getSimpleLambdaClientCacheKey';
import { LogMethod, executeLambdaInvocation } from './executeLambdaInvocation';

/**
 * create a global synchronous cache that can be used to dedupe parallel requests infront of the async cache
 *
 * note
 * - this is required because we are instantiating the wrapper on each call
 * - this is passed in as an input to the wrapper
 */
const globalSyncCache = createCache({
  defaultSecondsUntilExpiration: 15 * 60, // per instructions in with-simple-caching, this must be as long as the longest promise duration
});

/**
 * a method to invoke a lambda function with best practices
 */
export const invokeLambdaFunction = async <O = any, I = any>({
  service: serviceName,
  function: functionName,
  stage,
  event,
  logDebug,
  cache,
}: {
  service: string;
  function: string;
  stage: string;
  event: I;
  logDebug?: LogMethod;
  cache?: SimpleCache<O>;
}): Promise<O> => {
  // define how to execute the lambda, based on whether caching was requested
  const execute = cache
    ? withSimpleCachingAsync(executeLambdaInvocation, {
        cache: { output: cache, deduplication: globalSyncCache },
        serialize: {
          key: ({ forInput: [input] }) =>
            getSimpleLambdaClientCacheKey({
              service: input.serviceName,
              function: input.functionName,
              stage: input.stage,
              event: input.event,
            }),
        },
      })
    : executeLambdaInvocation;

  // execute the lambda
  const result = await execute({
    serviceName,
    stage,
    functionName,
    event,
    logDebug,
  });

  // return the result
  return result;
};
