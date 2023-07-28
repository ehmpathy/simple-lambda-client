import { executeLambdaInvocation } from './executeLambdaInvocation';
import { invokeLambdaFunction } from './invokeLambdaFunction';

jest.mock('./executeLambdaInvocation');
const executeLambdaInvocationMock = executeLambdaInvocation as jest.Mock;

describe('createLambdaServiceClient', () => {
  it('should call executeLambdaInvocation correctly', async () => {
    const exampleEvent = '__EVENT__';
    await invokeLambdaFunction({
      service: 'svc-awesome',
      function: 'doCoolThing',
      stage: 'prod',
      event: exampleEvent,
    });
    expect(executeLambdaInvocationMock).toHaveBeenCalledWith({
      serviceName: 'svc-awesome',
      stage: 'prod',
      functionName: 'doCoolThing',
      event: exampleEvent,
    });
  });
  it('should call logDebug if passed in', async () => {
    const logDebugMock = jest.fn();
    const exampleEvent = '__EVENT__';
    await invokeLambdaFunction({
      service: 'svc-awesome',
      function: 'doCoolThing',
      stage: 'prod',
      event: exampleEvent,
      logDebug: logDebugMock,
    });
    expect(logDebugMock).toHaveBeenCalledTimes(2);
    expect(logDebugMock).toHaveBeenCalledWith(
      `svc-awesome-prod-doCoolThing.invoke.input`,
      { event: exampleEvent },
    );
    expect(logDebugMock).toHaveBeenCalledWith(
      `svc-awesome-prod-doCoolThing.invoke.output`,
      { result: undefined },
    );
  });
});
