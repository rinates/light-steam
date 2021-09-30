import { existsSync, promises as fs } from 'fs';

import { ConfigAttributes } from '@/config';
import { NoAccounts, NoProxies } from '@/cli/errors';

export default class FileManager {
  private configDir: string = 'config';

  private resultDir: string = 'result';

  private proxyFile: string = 'proxy.txt';

  private baseFile: string = 'base.txt';

  private currentDir: string = process.cwd();

  public async saveConfig(config: ConfigAttributes) {
    await fs.writeFile(`${this.currentDir}/config/default.json`, JSON.stringify({ Settings: config }, null, 4));
    logger.info('Config was created success');
  }

  public async checkDirsAndFiles() {
    [this.configDir, this.resultDir, this.proxyFile, this.baseFile].forEach((path) => {
      const fullPath = `${this.currentDir}/${path}`;

      if (!existsSync(fullPath)) {
        if (fullPath.endsWith('.txt')) {
          fs.writeFile(fullPath, '');
        } else {
          fs.mkdir(fullPath);
        }

        logger.info(`${path} was created success`);
      }
    });
  }

  public configExists(): boolean {
    return existsSync(`${this.currentDir}/config/default.json`);
  }

  public async getAccounts(): Promise<Array<string>> {
    logger.info('Getting accounts');

    const accounts = (await fs.readFile(this.baseFile, 'utf-8')).trim().split('\n');

    if (!accounts.length) throw NoAccounts;

    return accounts;
  }

  public async getProxies(): Promise<Array<string>> {
    logger.info('Getting proxies');

    const proxies = (await fs.readFile(this.proxyFile, 'utf-8')).trim().split('\n');

    if (!proxies.length) throw NoProxies;

    return proxies;
  }
}
