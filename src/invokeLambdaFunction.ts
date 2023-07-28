import { executeLambdaInvocation } from './executeLambdaInvocation';

export type LogMethod = (message: string, metadata: any) => void;
export const invokeLambdaFunction = async <O = any, I = any>({
  service: serviceName,
  function: functionName,
  stage,
  event,
  logDebug,
}: {
  service: string;
  function: string;
  stage: string;
  event: I;
  logDebug?: LogMethod;
}): Promise<O> => {
  if (logDebug)
    logDebug(`${serviceName}-${stage}-${functionName}.invoke.input`, { event });
  const result = await executeLambdaInvocation({
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
