import { Lambda } from 'aws-sdk';

import { UnsuccessfulStatusCodeError, LambdaInvocationError } from './errors';

const lambda = new Lambda();

/**
 * the shape of log method which can be used to report lambda invocations
 */
export type LogMethod = (message: string, metadata: any) => void;

/**
 * a method to execute a lambda invocation via the aws api with best practices
 */
export const executeLambdaInvocation = async ({
  serviceName,
  functionName,
  stage,
  event,
  logDebug,
}: {
  serviceName: string;
  functionName: string;
  stage: string;
  event: any;
  logDebug?: LogMethod;
}): Promise<any> => {
  const lambdaName = [serviceName, stage, functionName].join('-');

  // log the request, if enabled
  if (logDebug)
    logDebug(`${lambdaName}.invoke.input`, {
      event,
    });

  // invoke the lambda
  const response = await lambda
    .invoke({
      FunctionName: lambdaName,
      Payload: JSON.stringify(event),
    })
    .promise();
  if (response.StatusCode !== 200)
    throw new UnsuccessfulStatusCodeError({
      code: response.StatusCode,
      payload: response.Payload,
    });

  // attempt to parse the response into object
  let payload;
  try {
    payload = JSON.parse(response.Payload as string);
  } catch (error) {
    // if here, then we couldn't parse the result, it wasn't json. so just return the result unparsed
    payload = response.Payload;
  }

  // evaluate whether response contains an error
  const isAnErrorPayload =
    !!payload && // if the response exists and is truthy, then it may be an error object
    (false || // check if any of the following properties exist in the payload (since some responses may exclude one or the other)
      payload.errorMessage ||
      payload.errorType ||
      payload.stackTrace);
  if (isAnErrorPayload)
    throw new LambdaInvocationError({
      response: payload,
      lambda: lambdaName,
      event,
    });

  // log the response, if enabled
  if (logDebug)
    logDebug(`${lambdaName}.invoke.output`, {
      result: payload,
    });

  // return the payload
  return payload;
};
