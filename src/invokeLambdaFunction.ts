import { createCache } from 'simple-in-memory-cache';
import {
  SimpleCache,
  withSimpleCaching,
  withSimpleCachingAsync,
} from 'with-simple-caching';

import { getSimpleLambdaClientCacheKey } from './cache/getSimpleLambdaClientCacheKey';
import { LogMethod, executeLambdaInvocation } from './executeLambdaInvocation';

/**
 * create a global synchronous cache that can be used to dedupe parallel requests infront of the async cache
 *
 * note
 * - this is required because, although under the hood withSimpleCachingAsync does this too, because we instantiate the wrapper on each call, it's sync cache is not global
 * - therefore, we must define a global sync cache for the function ourselves, to avoid requiring the user to use the wrapper to create a new function
 * - this is safe to do globally as, fortunately, the inputs to the `invokeLambdaFunction` method already make each request globally unique :)
 */
const globalSyncCache = createCache();

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
    ? withSimpleCaching(
        withSimpleCachingAsync(executeLambdaInvocation, {
          cache, // dedupe requests across time and machines, with the user's input cache
          serialize: {
            key: ({ forInput: [input] }) =>
              getSimpleLambdaClientCacheKey({
                service: input.serviceName,
                function: input.functionName,
                stage: input.stage,
                event: input.event,
              }),
          },
        }),
        {
          cache: globalSyncCache, // dedupe parallel requests in-memory on same machine (details on why this is required is available on the definition of the globalSyncCache const)
        },
      )
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
