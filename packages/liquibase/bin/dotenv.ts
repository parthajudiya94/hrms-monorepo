import dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import fs from 'fs';
import path from 'path';

let { NODE_ENV } = process.env;

if (!NODE_ENV) {
  NODE_ENV = 'production';
}

const cwd = fs.realpathSync(process.cwd());

const envFiles: string[] = [
  path.resolve(cwd, `.env.${NODE_ENV}.local`),
  path.resolve(cwd, `.env.${NODE_ENV}`),
  NODE_ENV !== 'test' ? path.resolve(cwd, '.env.local') : '',
  path.resolve(cwd, '.env'),
].filter(Boolean);

envFiles.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    const result = dotenv.config({ path: filePath });
    if (result.parsed) {
      dotenvExpand.expand(result);
    }
  }
});
