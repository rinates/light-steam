import { existsSync, promises as fs } from 'fs';

import { ConfigAttributes } from '@/config';
import { NoAccounts, NoGames, NoProxies } from '@/cli/errors';
import { LimitAttributes } from '@/cli/components/AccountController';

export default class FileManager {
  private configDir: string = 'config';

  private resultDir: string = 'result';

  private proxyFile: string = 'proxy.txt';

  private baseFile: string = 'base.txt';

  private gamesFile: string = 'games.txt';

  private resultFileName: string = 'result.txt';

  private noLimitFileName: string = 'noLimit.txt';

  private limitFileName: string = 'limit.txt';

  private failedFileName: string = 'failed.txt';

  private donateFileName: string = 'limitDonate.txt';

  private resultDirPath: string | undefined;

  private currentDate: Date = new Date();

  private resultDirFileName: string = [
    `${this.currentDate.getFullYear()}-${this.currentDate.getMonth()}-${this.currentDate.getDate()}_`,
    `${this.currentDate.getHours()}-${this.currentDate.getMinutes()}-${this.currentDate.getSeconds()}`,
  ].join('');

  private currentDir: string = process.cwd();

  public async saveConfig(config: ConfigAttributes) {
    const defaultImap = {
      'imap.mail.ru': {
        port: 993,
        domains: [
          '@mail.ru',
          '@mail.ua',
          '@internet.ru',
          '@bk.ru',
          '@inbox.ru',
          '@list.ru',
        ],
      },
      'imap.rambler.ru': {
        port: 993,
        domains: [
          '@rambler.ru',
        ],
      },
    };

    await fs.writeFile(`${this.currentDir}/config/default.json`, JSON.stringify({ Settings: config, DefaultImap: defaultImap }, null, 4));
    logger.info('Config was created success');
  }

  public async checkDirsAndFiles() {
    [
      this.configDir, this.resultDir, this.proxyFile, this.baseFile, this.gamesFile,
    ].forEach((path) => {
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
    logger.info(`Empty result dir was created as ${this.resultDirFileName}`);

    this.resultDirPath = `${this.currentDir}/${this.resultDir}/${this.resultDirFileName}`;

    await fs.mkdir(this.resultDirPath);
    await fs.writeFile(`${this.resultDirPath}/result.txt`, '');
  }

  public async appendToFailed(account: string) {
    logger.info(`Append account to the failed [${account}]`);

    await fs.appendFile(`${this.resultDirPath}/${this.failedFileName}`, `${account}\n`);
  }

  public async appendToResult(account: string, limitInfo: LimitAttributes, steamId: string) {
    logger.info(`Append account to the result [${account}]`);

    const data = [
      '================================================================',
      `${account}`,
      `Limit: ${limitInfo.limit}`,
      `Limit donate: ${limitInfo.balance}`,
      `SteamURL: https://steamcommunity.com/profiles/${steamId}\n`,
    ].join('\n');

    if (limitInfo.limit) {
      await fs.appendFile(`${this.resultDirPath}/${this.limitFileName}`, data);
    } else {
      await fs.appendFile(`${this.resultDirPath}/${this.noLimitFileName}`, data);
    }

    if (!limitInfo.limit && limitInfo.balance !== 0) {
      await fs.appendFile(`${this.resultDirPath}/${this.donateFileName}`, data);
    }

    await fs.appendFile(`${this.resultDirPath}/${this.resultFileName}`, data);
  }

  public async getAccounts(): Promise<Array<string>> {
    logger.info('Getting accounts');

    const accounts = (await fs.readFile(this.baseFile, 'utf-8')).trim().split('\n');

    if (!accounts.length) throw new NoAccounts('Add accounts and try again');

    return accounts;
  }

  public async getProxies(): Promise<Array<string>> {
    logger.info('Getting proxies');

    const proxies = (await fs.readFile(this.proxyFile, 'utf-8')).trim().split('\n');

    if (!proxies.length) throw new NoProxies('Add proxies and try again');

    return proxies;
  }

  public async getGames(): Promise<Array<string>> {
    logger.info('Getting games');

    const games = (await fs.readFile(this.gamesFile, 'utf-8')).trim().split('\n');

    if (!games.length) throw new NoGames('Add proxies and try again');

    return games;
  }
}
