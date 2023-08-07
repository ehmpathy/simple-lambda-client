import { getSimpleLambdaClientCacheKey } from './getSimpleLambdaClientCacheKey';

describe('getSimpleLambdaClientCacheKey', () => {
  it('should produce an observable and unique cache key', async () => {
    const key = getSimpleLambdaClientCacheKey({
      service: 'svc-cargo-ships',
      function: 'getContainersOnShip',
      stage: 'dev',
      event: { shipUuid: '__ship_uuid__' },
    });
    expect(key).toEqual(
      'svc-cargo-ships-dev-getContainersOnShip.shipUuid.__ship_uuid__.487dee1bce26ff47f8e05f5a3728889217c666de22a939e8786be0501b71c66f',
    );
  });
});
