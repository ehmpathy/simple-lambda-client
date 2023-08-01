import { executeLambdaInvocation } from './executeLambdaInvocation';
import { invokeLambdaFunction } from './invokeLambdaFunction';

jest.mock('./executeLambdaInvocation');
const executeLambdaInvocationMock = executeLambdaInvocation as jest.Mock;
executeLambdaInvocationMock.mockResolvedValue('__result__');

describe('createLambdaServiceClient', () => {
  beforeEach(() => jest.clearAllMocks());
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
  describe('cache', () => {
    it('should use the cache if passed in', async () => {
      const exampleStore: Record<string, any> = {};
      const cacheGetMock = jest.fn((key) => exampleStore[key]);
      const cacheSetMock = jest.fn((key, value) => (exampleStore[key] = value));
      const exampleEvent = '__EVENT__';
      await invokeLambdaFunction({
        service: 'svc-awesome',
        function: 'doCoolThing',
        stage: 'prod',
        event: exampleEvent,
        cache: { get: cacheGetMock, set: cacheSetMock },
      });
      expect(cacheGetMock).toHaveBeenCalledTimes(2);
      expect(cacheSetMock).toHaveBeenCalledTimes(1);
    });
    it('should dedupe parallel requests if cache is passed in', async () => {
      const exampleStore: Record<string, any> = {};
      const cacheGetMock = jest.fn((key) => exampleStore[key]);
      const cacheSetMock = jest.fn((key, value) => (exampleStore[key] = value));
      const exampleEvent = '__EVENT__';
      await Promise.all([
        invokeLambdaFunction({
          service: 'svc-awesome',
          function: 'doAnotherCoolThing',
          stage: 'prod',
          event: exampleEvent,
          cache: { get: cacheGetMock, set: cacheSetMock },
        }),
        invokeLambdaFunction({
          service: 'svc-awesome',
          function: 'doAnotherCoolThing',
          stage: 'prod',
          event: exampleEvent,
          cache: { get: cacheGetMock, set: cacheSetMock },
        }),
      ]);
      expect(cacheGetMock).toHaveBeenCalledTimes(2); // 2 for first get+set+get; 0 for the next get, since the global in memory cache should have captured it
      expect(cacheSetMock).toHaveBeenCalledTimes(1);
      expect(executeLambdaInvocationMock).toHaveBeenCalledTimes(1);
    });
  });
});
