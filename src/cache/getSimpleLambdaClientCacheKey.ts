import { sha256 } from 'cross-sha256';

/**
 * defines the uri-safe cache key used by simple-lambda-client requests with-simple-caching
 */
export const getSimpleLambdaClientCacheKey = ({
  service: serviceName,
  function: functionName,
  stage,
  event,
}: {
  service: string;
  function: string;
  stage: string;
  event: Record<string, any>;
}): string => {
  const idealKey = [
    [serviceName, stage, functionName].join('-'),
    JSON.stringify(event),
  ].join('.');

  // define a human readable part, to help with observability
  const humanPart = idealKey
    .replace(/:/g, '.')
    .replace(/[^\w\-\_\.]/g, '')
    .replace(/\.\./g, '.');

  // define a unique part, to guarantee uniqueness
  const uniquePart = new sha256()
    .update(JSON.stringify(idealKey))
    .digest('hex');

  // join the parts for the full key
  return [humanPart, uniquePart].join('.');
};
