import { Lambda } from 'aws-sdk';

import { LambdaInvocationError } from './errors';
import { executeLambdaInvocation } from './executeLambdaInvocation';

/*

  return ({
    StatusCode: parsedPayloadRequest.StatusCode,
    Payload: payloadToReturn,
  });
*/
jest.mock('aws-sdk', () => {
  const invokePromiseMock = jest.fn();
  const invoke = jest.fn().mockImplementation(() => ({
    promise: invokePromiseMock,
  }));
  const LambdaMock = jest.fn().mockImplementation(() => ({
    // tslint:disable-line
    invoke,
  }));
  return {
    Lambda: LambdaMock,
  };
});
const invokeMock = new Lambda().invoke as jest.Mock;
const invokePromiseMock = new Lambda().invoke().promise as jest.Mock;
invokePromiseMock.mockResolvedValue({
  StatusCode: 200,
  Payload: '{"awesome":"response"}',
});

describe('execute', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should be use the aws-sdk to invoke the lambda', async () => {
    await executeLambdaInvocation({
      serviceName: 'your-very-awesome-service',
      stage: 'dev',
      functionName: 'doAwesomeThing',
      event: { test: 'payload' },
    });
    expect(invokeMock.mock.calls.length).toEqual(1);
    expect(invokeMock.mock.calls[0][0]).toMatchObject({
      FunctionName: 'your-very-awesome-service-dev-doAwesomeThing',
      Payload: JSON.stringify({ test: 'payload' }),
    });
  });
  it('should throw the expected error if response status code is not 200', async () => {
    invokePromiseMock.mockResolvedValueOnce({ StatusCode: 400 });
    try {
      await executeLambdaInvocation({
        serviceName: 'your-very-awesome-service',
        stage: 'dev',
        functionName: 'doAwesomeThing',
        event: { test: 'payload' },
      });
      throw new Error('should not reach here');
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      expect(error.constructor.name).toEqual('UnsuccessfulStatusCodeError');
    }
  });
  it('should throw a helpful error if the lambda resolves successfuly, with statuscode 200, but with an error object', async () => {
    const errorResponse = {
      errorMessage: 'Data must be a string or a buffer',
      errorType: 'TypeError',
      stackTrace: [
        'Hash.update (crypto.js:99:16)',
        'AsyncFunction.sha256sync [as sync] (/var/task/node_modules/simple-sha256/index.js:12:6)',
        'new Description (/var/task/dist/models/description.js:19:61)',
        'Object.<anonymous> (/var/task/dist/services/idea/recordIdeaFromEvent.js:30:25)',
        'Generator.next (<anonymous>)',
        '/var/task/dist/services/idea/recordIdeaFromEvent.js:7:71',
        'new Promise (<anonymous>)',
        '__awaiter (/var/task/dist/services/idea/recordIdeaFromEvent.js:3:12)',
        'Object.recordIdeaFromEvent [as default] (/var/task/dist/services/idea/recordIdeaFromEvent.js:22:40)',
        'Object.<anonymous> (/var/task/dist/handlers/recordNewIdea.js:26:53)',
      ],
    };
    invokePromiseMock.mockResolvedValue({
      StatusCode: 200,
      Payload: JSON.stringify(errorResponse),
    });
    try {
      await executeLambdaInvocation({
        serviceName: 'your-very-awesome-service',
        stage: 'dev',
        functionName: 'doAwesomeThing',
        event: { test: 'payload' },
      });
      throw new Error('should not reach here');
    } catch (error) {
      if (!(error instanceof LambdaInvocationError)) throw error;
      expect(error).toHaveProperty('event');
      expect(error).toHaveProperty('lambda');
      expect(error).toHaveProperty('response');
      expect(error.message).toEqual(
        `An error was returned as the lambda invocation response for the lambda 'your-very-awesome-service-dev-doAwesomeThing': "Data must be a string or a buffer". See error properties for more details.`,
      );
      expect(error.event).toEqual({ test: 'payload' });
      expect(error.response).toEqual(errorResponse);
      expect(error.lambda).toEqual(
        'your-very-awesome-service-dev-doAwesomeThing',
      );
    }
  });
  it('should be able to handle a `null` response', async () => {
    invokePromiseMock.mockResolvedValue({ StatusCode: 200, Payload: null });
    const response = await await executeLambdaInvocation({
      serviceName: 'your-very-awesome-service',
      stage: 'dev',
      functionName: 'doAwesomeThing',
      event: { test: 'payload' },
    });
    expect(response).toEqual(null);
  });
});
