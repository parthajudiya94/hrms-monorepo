import { IOptions } from '../src/types';

export function getEnvOptions(env: string): IOptions {
  const defaultOptions: IOptions = {
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || '3306',
    dbName: process.env.DB_NAME || 'hrms',
    dbUser: process.env.DB_USER || 'root',
    dbPass: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    changeLogFile: process.env.CHANGELOG_FILE || 'changelog.xml',
  };

  switch (env) {
    case 'local':
      return {
        ...defaultOptions,
      };
    case 'test':
      return {
        ...defaultOptions,
      };
    case 'ci':
      return {
        ...defaultOptions,
        dbHost: process.env.DB_HOST || '192.168.12.180',
        dbName: process.env.DB_NAME || 'realtimeci',
      };
    case 'sit':
      return {
        ...defaultOptions,
        dbHost: process.env.DB_HOST || '192.168.12.180',
        dbName: process.env.DB_NAME || 'realtimesit',
      };
    case 'uat':
      return {
        ...defaultOptions,
        dbHost: process.env.DB_HOST || '172.16.38.155',
        dbName: process.env.DB_NAME || 'realtimeuat',
      };
    case 'dem':
      return {
        ...defaultOptions,
        dbHost: process.env.DB_HOST || '172.16.38.155',
        dbName: process.env.DB_NAME || 'realtimedem',
      };
    case 'trg':
    case 'docker':
    case 'prod':
      return {
        ...defaultOptions,
      };
    default:
      // If we have an unknown environment use the data set up elsewhere (github/config files),
      // else default it to junk so the deployment steps will blow up further down the line.
      return {
        ...defaultOptions,
        dbHost: process.env.DB_HOST || '1.1.1.1',
        dbName: process.env.DB_NAME || 'UNKNOWN',
      };
  }
}
