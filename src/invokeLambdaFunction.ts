import { SimpleCache, withSimpleCachingAsync } from 'with-simple-caching';

import { executeLambdaInvocation } from './executeLambdaInvocation';

export type LogMethod = (message: string, metadata: any) => void;
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
    ? withSimpleCachingAsync(executeLambdaInvocation, { cache })
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
