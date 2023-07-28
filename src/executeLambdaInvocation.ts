import { Lambda } from 'aws-sdk';

import { UnsuccessfulStatusCodeError, LambdaInvocationError } from './errors';

const lambda = new Lambda();

export const executeLambdaInvocation = async ({
  serviceName,
  functionName,
  stage,
  event,
}: {
  serviceName: string;
  functionName: string;
  stage: string;
  event: any;
}): Promise<any> => {
  const lambdaName = [serviceName, stage, functionName].join('-');

  // 1. invoke the lambda
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

  // 2. attempt to parse the response into object
  let payload;
  try {
    payload = JSON.parse(response.Payload as string);
  } catch (error) {
    // if here, then we couldn't parse the result, it wasn't json. so just return the result unparsed
    payload = response.Payload;
  }

  // 3. evaluate whether response contains an error
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

  // 4. return the payload
  return payload;
};
