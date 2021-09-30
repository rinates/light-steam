import { existsSync, promises as fs } from 'fs';

import { ConfigAttributes } from '@/config';

export default class FileManager {
  private currentDir = process.cwd();

  public async saveConfig(config: ConfigAttributes) {
    await fs.writeFile(`${this.currentDir}/config/default.json`, JSON.stringify({ Settings: config }, null, 4));
    logger.info('Config was created success');
  }

  public async checkDirsAndFiles() {
    const configDir = 'config';
    const resultDir = 'result';
    const proxyFile = 'proxy.txt';
    const baseFile = 'base.txt';

    [configDir, resultDir, proxyFile, baseFile].forEach((path) => {
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
}
