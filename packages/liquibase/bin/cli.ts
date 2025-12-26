#!/usr/bin/env node

// NOTE: without this reference, ts-node throws a ts error about `to-regex` not having types.
/// <reference path="../@types/index.d.ts" />

import chalk from 'chalk';
import meow, { Options, StringFlag } from 'meow';
import { userInfo } from 'os';
import path from 'path';
import prompts from 'prompts';
import toRegex from 'to-regex';
import * as yup from 'yup';
import { actions, envs, IAction, IEnv, ILogger, IOptions, LiquibaseManager } from '../src';
import './dotenv';
import { getEnvOptions } from './envOptions';

class Script {
  private readonly envOptions: IOptions;

  private logFormats: ILogger = {
    fatal: (msg: string) => `${chalk.bgRedBright(`[Fatal]`)} ${msg}`,
    error: (msg: string) => `${chalk.bgRed(`[Error]`)} ${msg}`,
    warn: (msg: string) => `${chalk.black.bgYellow(`[Warn]`)} ${msg}`,
    info: (msg: string) => `${chalk.bgBlue(`[Info]`)} ${msg}`,
    debug: (msg: string) => `${chalk.bgMagenta('[Debug]')} ${msg}`,
    trace: (msg: string) => `${chalk.bgGray('[Trace]')} ${msg}`,
  };

  constructor(env: string) {
    this.envOptions = getEnvOptions(env);
  }

  private logger(): ILogger {
    const { fatal, error, warn, info, debug, trace } = this.logFormats;

    const redactSecrets = (msg: string): string => {
      const replace = [this.envOptions.dbPass];
      if (replace.filter((s) => !!s).length === 0) {
        return msg;
      }
      return msg.replace(toRegex([this.envOptions.dbPass], { flags: 'g', contains: true }), '***');
    };

    return {
      /* eslint-disable no-console */
      fatal: (msg: string, ...params: any[]) => console.log(fatal(redactSecrets(msg), ...params)),
      error: (msg: string, ...params: any[]) => console.log(error(redactSecrets(msg), ...params)),
      warn: (msg: string, ...params: any[]) => console.log(warn(redactSecrets(msg), ...params)),
      info: (msg: string, ...params: any[]) => console.log(info(redactSecrets(msg), ...params)),
      debug: (msg: string, ...params: any[]) => console.log(debug(redactSecrets(msg), ...params)),
      trace: (msg: string, ...params: any[]) => console.log(trace(redactSecrets(msg), ...params)),
      /* eslint-enable no-console */
    };
  }

  private async validate(config: any): Promise<{ action: IAction; env: IEnv }> {
    const { action, env } = await yup
      .object({
        action: yup.string().oneOf<IAction>(actions).required(),
        env: yup.string().oneOf<IEnv>(envs).required(),
      })
      .required()
      .validate(config, { abortEarly: true });

    return { action, env } as { action: IAction; env: IEnv };
  }

  private async dev(liquibase: LiquibaseManager, env: IEnv) {
    let loop = true;
    while (loop) {
      // eslint-disable-next-line no-await-in-loop
      const { action } = await prompts([
        {
          type: 'select',
          name: 'action',
          message: 'Select an action',
          choices: [
            { title: 'Deploy', value: 'deploy' },
            { title: 'Undeploy', value: 'undeploy' },
            { title: 'Lint', value: 'i18n-lint' },
            { title: 'New Changelog', value: 'new-changelog' },
            { title: 'Exit', value: 'exit' },
          ],
        },
      ]);

      switch (action) {
        case 'exit':
          loop = false;
          break;
        case 'deploy':
          // eslint-disable-next-line no-await-in-loop
          await liquibase.deploy(env);
          break;
        case 'undeploy':
          // eslint-disable-next-line no-await-in-loop
          await this.devUndeploy(liquibase, env);
          break;
        case 'i18n-lint':
          // eslint-disable-next-line no-await-in-loop
          await liquibase.lintI18n();
          break;
        case 'new-changelog':
          // eslint-disable-next-line no-await-in-loop
          await this.newChangelog(liquibase);
          break;
        default:
          throw new Error(`unknown action '${action}'`);
      }
    }
  }

  private async devUndeploy(liquibase: LiquibaseManager, env: IEnv) {
    const { action, count, date } = await prompts([
      {
        type: 'select',
        name: 'action',
        message: 'Undeploy mode',
        choices: [
          { title: 'Everything', value: 'undeploy', description: 'Drops everything in your database' },
          { title: 'By count', value: 'count', description: 'Rolls back a number of changesets' },
          { title: 'By Date', value: 'date', description: 'Rolls back any changesets run after the given date' },
          { title: 'Cancel', value: 'exit' },
        ],
      },
      {
        type: (prev) => (prev === 'count' ? 'number' : null),
        name: 'count',
        message: 'Number of changesets to roll back',
      },
      {
        type: (prev) => (prev === 'date' ? 'number' : null),
        name: 'date',
        message: 'Date to roll back to',
      },
    ]);

    switch (action) {
      case 'exit':
        break;
      case 'undeploy':
        await liquibase.undeploy(env);
        break;
      case 'count':
        await liquibase.rollbackCount(env, count);
        break;
      case 'date':
        await liquibase.rollbackDate(env, (date as Date).toISOString());
        break;
      default:
        throw new Error(`unknown action '${action}'`);
    }
  }

  private async newChangelog(manager: LiquibaseManager) {
    const response = await prompts([
      { type: 'text', name: 'sprint', message: 'Sprint' },
      { type: 'text', name: 'ticket', message: 'Ticket Number' },
    ]);
    const user = userInfo();

    return manager.newChangelog({ user: user.username, sprint: response.sprint, ticket: response.ticket });
  }

  async run(config: any, args?: string[]) {
    const { action, env } = await this.validate(config);

    try {
      const liquibase = new LiquibaseManager(this.envOptions, this.logger());

      switch (action as IAction) {
        case 'deploy':
          await liquibase.deploy(env);
          break;
        case 'undeploy':
          await liquibase.undeploy(env);
          break;
        case 'rollback-count':
          if (!args || args.length !== 1) {
            throw new Error(
              `rollback-count requires 1 additional input of 'count'\n    (e.g. npm run rollback-count -- 10)`,
            );
          }

          await liquibase.rollbackCount(env, Number.parseInt(args[0], 10));
          break;
        case 'rollback-date':
          if (!args || args.length !== 1) {
            throw new Error(
              `rollback-date requires 1 additional input of 'date'\n    (e.g. npm run rollback-date -- "YYYY-MM-DD HH:MM:SS")`,
            );
          }

          await liquibase.rollbackDate(env, args[0]);
          break;
        case 'release-locks':
          await liquibase.releaseLocks(env);
          break;
        case 'status':
          await liquibase.status(env);
          break;
        case 'i18n-lint':
          await liquibase.lintI18n();
          break;
        case 'i18n-generate':
          await liquibase.generateI18n();
          break;
        case 'new-changelog':
          await this.newChangelog(liquibase);
          break;
        case 'dev':
          await this.dev(liquibase, env);
          break;
        case 'debug':
          await liquibase.debugOptions(env, args);
          break;
        default:
          throw new Error(`unknown action flag '${action}'`);
      }
    } catch (err) {
      if (err instanceof Error) {
        this.logger().error(err.message);
        throw err;
      }

      this.logger().error('a unknown error occurred', { err });
      throw err;
    }

    this.logger().info('done!');
  }
}

// Create a mock importMeta for CommonJS compatibility
// meow requires importMeta.url to be a file:// URL
const fileUrl = path.isAbsolute(__filename) 
  ? `file:///${__filename.replace(/\\/g, '/')}`
  : `file://${path.resolve(process.cwd(), __filename).replace(/\\/g, '/')}`;

const mockImportMeta = {
  url: fileUrl,
} as ImportMeta;

const meowOptions: Options<{ action: StringFlag; env: StringFlag }> = {
  importMeta: mockImportMeta,
  flags: {
    action: { type: 'string', alias: 'a', isRequired: true },
    env: { type: 'string', alias: 'e', default: 'local' },
  },
};

const { flags, input } = meow(
  `Options:

    --action, -a        Action to run
                        One of: ${actions.join(', ')}

    --env, -e           (Optional) Environment to run against, defaults to local
                        One of: ${envs.join(', ')}
`,
  meowOptions,
);

new Script(flags.env as string).run(flags, input).catch(() => process.exit(1));
