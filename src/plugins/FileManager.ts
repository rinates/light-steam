import { existsSync, promises as fs } from 'fs';

import { ConfigAttributes } from '@/config';
import { NoAccounts, NoProxies } from '@/cli/errors';

export default class FileManager {
  private configDir: string = 'config';

  private resultDir: string = 'result';

  private proxyFile: string = 'proxy.txt';

  private baseFile: string = 'base.txt';

  private currentDate: Date = new Date();

  private resultFileName: string = [
    `${this.currentDate.getFullYear()}-${this.currentDate.getMonth()}-${this.currentDate.getDate()}_`,
    `${this.currentDate.getHours()}:${this.currentDate.getMinutes()}:${this.currentDate.getSeconds()}`,
  ].join('');

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

  public async createResult(): Promise<void> {
    logger.info(`Empty result file was created as ${this.resultFileName}.txt`);

    await fs.writeFile(`${this.currentDir}/${this.resultFileName}`, '');
  }

  public async appendToResult(account: string, steamId: string | undefined) {
    logger.info(`Append account to the result [${account}]`);

    const data = [
      '================================================================',
      `${account}`,
      `SteamURL: https://steamcommunity.com/profiles/${steamId}`,
    ].join('\n');

    await fs.appendFile(this.resultFileName, data);
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
