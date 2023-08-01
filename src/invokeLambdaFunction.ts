import { createCache } from 'simple-in-memory-cache';
import {
  SimpleCache,
  withSimpleCaching,
  withSimpleCachingAsync,
} from 'with-simple-caching';

import { executeLambdaInvocation } from './executeLambdaInvocation';

/**
 * create a global synchronous cache that can be used to dedupe parallel requests infront of the async cache
 *
 * note
 * - this is required because, although under the hood withSimpleCachingAsync does this too, because we instantiate the wrapper on each call, it's sync cache is not global
 * - therefore, we must define a global sync cache for the function ourselves, to avoid requiring the user to use the wrapper to create a new function
 * - this is safe to do globally as, fortunately, the inputs to the `invokeLambdaFunction` method already make each request globally unique :)
 */
const globalSyncCache = createCache();

export type LogMethod = (message: string, metadata: any) => void;

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
  if (logDebug)
    logDebug(`${serviceName}-${stage}-${functionName}.invoke.input`, { event });
  const execute = cache
    ? withSimpleCaching(
        withSimpleCachingAsync(executeLambdaInvocation, {
          cache, // dedupe requests across time and machines, with the user's input cache
        }),
        {
          cache: globalSyncCache, // dedupe parallel requests in-memory on same machine (details on why this is required is available on the definition of the globalSyncCache const)
        },
      )
    : executeLambdaInvocation;
  const result = await execute({
    serviceName,
    stage,
    functionName,
    event,
  });
  if (logDebug)
    logDebug(`${serviceName}-${stage}-${functionName}.invoke.output`, {
      result,
    });
  return result;
};
