/* eslint-disable max-classes-per-file */

export class UnsuccessfulStatusCodeError extends Error {
  constructor({ code, payload }: { code: number | undefined; payload: any }) {
    const message = `Status code does not indicate success: ${code};
    ${JSON.stringify(payload)}`;
    super(message);
  }
}

export class LambdaInvocationError extends Error {
  /**
   * the name of the lambda that returned the error
   */
  public lambda: string;

  /**
   * invocation errors that we detect contain one of the following three keys
   *
   * they are all optional, because some error responses contain one but not all
   */
  public response: {
    errorMessage?: string;
    errorType?: string;
    stackTrace?: string;
  };

  /**
   * the event that the lambda was invoked with
   */
  public event: any;

  constructor({
    lambda,
    response,
    event,
  }: {
    lambda: string;
    response: any;
    event: any;
  }) {
    const message = `An error was returned as the lambda invocation response for the lambda '${lambda}': "${response.errorMessage}". See error properties for more details.`;
    super(message);
    this.lambda = lambda;
    this.response = response;
    this.event = event;
  }
}
