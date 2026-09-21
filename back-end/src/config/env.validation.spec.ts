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

  it('leaves RabbitMQ off unless RABBITMQ_URL is set, and names the default queue', () => {
    expect(validateEnv({ DATABASE_URL: DB })).toMatchObject({
      RABBITMQ_URL: undefined,
      RABBITMQ_QUEUE: 'training_attendance_assessment',
    });
    expect(validateEnv({ DATABASE_URL: DB, RABBITMQ_URL: '' })).toMatchObject({
      RABBITMQ_URL: undefined,
    });
  });

  it('accepts amqp:// and amqps:// for RABBITMQ_URL, and a custom queue', () => {
    expect(
      validateEnv({
        DATABASE_URL: DB,
        RABBITMQ_URL: 'amqp://u:p@rabbitmq:5672',
        RABBITMQ_QUEUE: 'my_queue',
      }),
    ).toMatchObject({
      RABBITMQ_URL: 'amqp://u:p@rabbitmq:5672',
      RABBITMQ_QUEUE: 'my_queue',
    });
    expect(() =>
      validateEnv({ DATABASE_URL: DB, RABBITMQ_URL: 'amqps://u:p@host' }),
    ).not.toThrow();
  });

  it('rejects a RABBITMQ_URL that is not an AMQP connection string', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: DB, RABBITMQ_URL: 'http://localhost:15672' }),
    ).toThrow('RABBITMQ_URL');
  });

  it.each(['abc', '0', '70000', '3.5'])('rejects invalid PORT %s', (port) => {
    expect(() => validateEnv({ DATABASE_URL: DB, PORT: port })).toThrow('PORT');
  });
});
