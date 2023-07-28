export const testIfNotCicd = process.env.CI ? test.skip : test; // skip on ci, since we dont expect that the .env vars will be set and that aws access will be present
