export type IAction =
  | 'deploy'
  | 'undeploy'
  | 'rollback-count'
  | 'rollback-date'
  | 'release-locks'
  | 'status'
  | 'i18n-lint'
  | 'i18n-generate'
  | 'new-changelog'
  | 'dev'
  | 'debug';

export type IEnv = 'local' | 'test' | 'ci' | 'sit' | 'uat' | 'dem' | 'trg' | 'docker' | 'prod';

export interface IOptions {
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPass: string;
  changeLogFile: string;
}

export interface ILogger {
  fatal: (msg: string, ...params: any[]) => void;
  error: (msg: string, ...params: any[]) => void;
  warn: (msg: string, ...params: any[]) => void;
  info: (msg: string, ...params: any[]) => void;
  debug: (msg: string, ...params: any[]) => void;
  trace: (msg: string, ...params: any[]) => void;
}

export const actions: IAction[] = [
  'deploy',
  'undeploy',
  'rollback-count',
  'rollback-date',
  'release-locks',
  'status',
  'i18n-lint',
  'i18n-generate',
  'new-changelog',
  'dev',
  'debug',
];

export const envs: IEnv[] = ['local', 'test', 'ci', 'sit', 'uat', 'dem', 'trg', 'docker', 'prod'];

