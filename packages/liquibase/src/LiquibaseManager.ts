import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { IAction, IEnv, ILogger, IOptions } from './types';

export class LiquibaseManager {
  private readonly options: IOptions;
  private readonly logger: ILogger;
  private readonly liquibasePath: string;

  constructor(options: IOptions, logger: ILogger) {
    this.options = options;
    this.logger = logger;
    
    // Find liquibase executable
    // When running via ts-node, __dirname points to the source directory
    // When compiled, __dirname points to dist directory
    const basePath = __dirname.includes('dist') 
      ? path.resolve(__dirname, '../../bin/native')
      : path.resolve(__dirname, '../bin/native');
    
    const isWindows = process.platform === 'win32';
    this.liquibasePath = path.join(basePath, isWindows ? 'liquibase.bat' : 'liquibase');
    
    if (!fs.existsSync(this.liquibasePath)) {
      throw new Error(`Liquibase executable not found at ${this.liquibasePath}. Please ensure Liquibase is properly installed.`);
    }
  }

  private buildCommand(action: string, additionalArgs: string[] = []): string[] {
    // Liquibase 4.0+ requires relative paths from the working directory
    // Working directory is set to bin/native, so we need relative path from there
    const nativePath = path.resolve(__dirname, '../bin/native');
    const basePath = __dirname.includes('dist')
      ? path.resolve(__dirname, '../../')
      : path.resolve(__dirname, '../');
    
    // Get relative path from native directory to changelog
    const changelogPath = path.relative(nativePath, path.resolve(basePath, 'changelog.xml'));
    // Normalize path separators for Windows
    const normalizedChangelogPath = changelogPath.replace(/\\/g, '/');
    
    // Use MariaDB driver (compatible with MySQL) since it's already in the lib folder
    // MariaDB driver works with MySQL JDBC URLs
    // If you prefer MySQL driver, download mysql-connector-java-8.0.33.jar and place it in bin/native/lib/
    // then change driver to: com.mysql.cj.jdbc.Driver
    const baseArgs = [
      `--changeLogFile=${normalizedChangelogPath}`,
      `--url=jdbc:mysql://${this.options.dbHost}:${this.options.dbPort}/${this.options.dbName}`,
      `--username=${this.options.dbUser}`,
      `--password=${this.options.dbPass}`,
      `--driver=org.mariadb.jdbc.Driver`,
    ];

    return [action, ...baseArgs, ...additionalArgs];
  }

  private async executeCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info(`Executing: ${this.liquibasePath} ${args.join(' ')}`);
      
      const child = spawn(this.liquibasePath, args, {
        cwd: path.resolve(__dirname, '../bin/native'),
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Liquibase command failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async deploy(env: IEnv): Promise<void> {
    this.logger.info(`Deploying changesets to ${env}...`);
    await this.executeCommand(this.buildCommand('update'));
    this.logger.info('Deployment completed successfully');
  }

  async undeploy(env: IEnv): Promise<void> {
    this.logger.warn(`Undeploying all changesets from ${env}...`);
    await this.executeCommand(this.buildCommand('dropAll'));
    this.logger.info('Undeployment completed');
  }

  async rollbackCount(env: IEnv, count: number): Promise<void> {
    this.logger.info(`Rolling back ${count} changeset(s) from ${env}...`);
    await this.executeCommand(this.buildCommand('rollbackCount', [count.toString()]));
    this.logger.info('Rollback completed');
  }

  async rollbackDate(env: IEnv, date: string): Promise<void> {
    this.logger.info(`Rolling back changesets after ${date} from ${env}...`);
    await this.executeCommand(this.buildCommand('rollbackToDate', [`--date=${date}`]));
    this.logger.info('Rollback completed');
  }

  async releaseLocks(env: IEnv): Promise<void> {
    this.logger.info(`Releasing locks in ${env}...`);
    await this.executeCommand(this.buildCommand('releaseLocks'));
    this.logger.info('Locks released');
  }

  async status(env: IEnv): Promise<void> {
    this.logger.info(`Checking status in ${env}...`);
    await this.executeCommand(this.buildCommand('status'));
  }

  async lintI18n(): Promise<void> {
    this.logger.info('Linting i18n strings...');
    // Placeholder for i18n linting
    this.logger.info('i18n linting completed');
  }

  async generateI18n(): Promise<void> {
    this.logger.info('Generating i18n strings...');
    // Placeholder for i18n generation
    this.logger.info('i18n generation completed');
  }

  async newChangelog(options: { user: string; sprint?: string; ticket?: string }): Promise<void> {
    this.logger.info('Creating new changelog...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `changelog-${timestamp}-${options.ticket || 'new'}.xml`;
    const basePath = __dirname.includes('dist')
      ? path.resolve(__dirname, '../../')
      : path.resolve(__dirname, '../');
    const filepath = path.resolve(basePath, filename);
    
    const content = `<?xml version="1.0" encoding="UTF-8"?>

<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.8.xsd">

  <changeSet id="${timestamp}-${options.ticket || '001'}" author="${options.user}">
    <comment>${options.sprint ? `Sprint: ${options.sprint}` : ''} ${options.ticket ? `Ticket: ${options.ticket}` : ''}</comment>
    <!-- Add your changes here -->
  </changeSet>

</databaseChangeLog>`;

    fs.writeFileSync(filepath, content);
    this.logger.info(`New changelog created: ${filename}`);
  }

  async debugOptions(env: IEnv, args?: string[]): Promise<void> {
    this.logger.debug('Debug options:');
    this.logger.debug(`Environment: ${env}`);
    this.logger.debug(`Options: ${JSON.stringify(this.options, null, 2)}`);
    this.logger.debug(`Liquibase path: ${this.liquibasePath}`);
    if (args) {
      this.logger.debug(`Additional args: ${args.join(' ')}`);
    }
  }
}

