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
// ...do amazing things with job
```

### namespace

You may also want to build a full representation of some lambda service under a namespace

```ts
export const svcJobs = {
  getJobByUuid,
  // other methods...
};
```

To add extra context about "where" getJobByUuid is coming from

```ts
import { svcJobs } from '../path/to/client';

const { job } = await svcJobs.getJobByUuid({ uuid: '__uuid__' });
// ...do amazing things with job
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
