# simple-lambda-client

![ci_on_commit](https://github.com/uladkasach/simple-lambda-client/workflows/test/badge.svg)
![deploy_on_tag](https://github.com/uladkasach/simple-lambda-client/workflows/publish/badge.svg)

A simple, convenient way to invoke aws lambda functions with best practices.

Best practices:

- optional logDebug of input and output
- throw an error if response contains an error object

# install

```sh
npm install --save simple-lambda-client
```

# use

```ts
import { invokeLambdaFunction } from 'simple-lambda-client';

const service = 'svc-jobs';
const stage = getStage();

const getJobByUuid = (event: { uuid: string }): Promise<{ job: Job | null }> =>
  invokeLambdaFunction({ service, stage, function: 'getJobByUuid', event });

const getJobsByPostal = (event: { postal: string }): Promise<{ jobs: Job[] }> =>
  invokeLambdaFunction({ service, stage, function: 'getJobsByPostal', event });

// ...

export const svcJobs = {
  getJobByUuid,
  getJobsByPostal
}
```

# details

### invoke

`simple-lambda-client` exports a function that lets you invoke lambda functions with best practices.

You can use this function directly if you want...

```ts
import { invokeLambdaFunction } from 'simple-lambda-client';

const result = await invokeLambdaFunction({ service, stage, function, event });
// ...do amazing things with result...
```

### type

But you'll probably want to create a reusable method with typedefs

```ts
export const getJobByUuid = (event: { uuid: string }) =>
  invokeLambdaFunction<{ job: Job | null }>({ service, stage, function: 'getJobByUuid', event });
```

Which makes using that a lot easier

```ts
const { job } = await getJobByUuid({ uuid: '__uuid__' });
// ...do amazing things with result...
```

### namespace

You may also want to build a full representation of some lambda service under a namespace

```ts
export const svcJobs = {
  getJobByUuid,
  // ...other methods...
};
```

This adds extra context about "where" the methods lambdas invoking is coming from

```ts
import { svcJobs } from '../path/to/client';

const { job } = await svcJobs.getJobByUuid({ uuid: '__uuid__' });
// ...do amazing things with result...
```

# features

### errors

When this library detects that the lambda you called has thrown an error, it automatically parses it and throws an error of class `LambdaInvocationError`

For example
```ts
import { invokeLambdaFunction, LambdaInvocationError } from 'simple-lambda-client';

try {
  await invokeLambdaFunction({
    service: 'svc-does-not-exist', // 👈 assume this will cause an error
    function: 'doAwesomeThing',
    stage: 'dev',
    event: {},
  });
} catch (error) {
  expect(error).toBeInstanceOf(LambdaInvocationError) // 👈 error will be an instance of this class
}
```

### logging

When given a `logDebug` method, this library emits input and output logs with best practices, to make debugging a breeze.

For example
```ts
await invokeLambdaFunction({
  service: 'svc-oceans',
  function: 'cleanup',
  stage: 'dev',
  event: {},
  logDebug: console.log, // 👈 will now emit logs to the console
});
```

### caching

When given a `cache` instance, this library will wrap the lambda invocation [with-simple-caching](https://github.com/ehmpathy/with-simple-caching)

For example
```ts
import { createCache } from 'simple-im-memory-cache';

await invokeLambdaFunction({
  service: 'svc-oceans',
  function: 'cleanup',
  stage: 'dev',
  event: {},
  cache: createCache(), // 👈 will now cache the response, with a key of [service, function, stage, event]
});
```


# tips

### lambda permissions

if you're using this client from inside a lambda, ensure that this lambda has permission to invoke other lambdas

```yml
# serverless.yml
iamRoleStatements:
  - Effect: Allow
    Action:
      - lambda:InvokeFunction
      - lambda:InvokeAsync
    Resource: '*' # TODO: constrain to a specific account, region, service, and stage
```
