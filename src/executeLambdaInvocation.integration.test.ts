import dotenv from 'dotenv';

import { testIfNotCicd } from './__test_utils__/testIfNotCicd';
import { executeLambdaInvocation } from './executeLambdaInvocation';

// load environmental variables from .env
dotenv.config();

// load test details from env vars
const testPayload = process.env.EXECUTE_PAYLOAD as string;
const serviceName = process.env.EXECUTE_SERVICE_NAME as string;
const functionName = process.env.EXECUTE_FUNCTION_NAME as string;
const stage = process.env.EXECUTE_STAGE as string;

describe('execute', () => {
  testIfNotCicd(
    'should be able to execute a call to invoke a lambda',
    async () => {
      const result = await executeLambdaInvocation({
        serviceName,
        stage,
        functionName,
        event: JSON.parse(testPayload),
      });
      expect(result).toEqual({ job: null });
    },
  );
});
