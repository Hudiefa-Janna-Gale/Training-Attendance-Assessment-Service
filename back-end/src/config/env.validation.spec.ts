import { validateEnv } from './env.validation.js';

const DB = 'postgresql://u:p@localhost:5435/db?schema=public';

describe('validateEnv', () => {
  it('applies defaults for PORT and CORS_ORIGIN', () => {
    expect(validateEnv({ DATABASE_URL: DB })).toMatchObject({
      PORT: 4000,
      CORS_ORIGIN: 'http://localhost:3000',
    });
  });

  it('coerces PORT to a number', () => {
    expect(validateEnv({ DATABASE_URL: DB, PORT: '5000' })).toMatchObject({
      PORT: 5000,
    });
  });

  it('accepts the postgres:// scheme as well as postgresql://', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: 'postgres://u:p@h/db' }),
    ).not.toThrow();
  });

  it('requires a PostgreSQL DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow('DATABASE_URL');
    expect(() =>
      validateEnv({ DATABASE_URL: 'mongodb://localhost/db' }),
    ).toThrow('DATABASE_URL');
  });

  it.each(['abc', '0', '70000', '3.5'])('rejects invalid PORT %s', (port) => {
    expect(() => validateEnv({ DATABASE_URL: DB, PORT: port })).toThrow('PORT');
  });
});
