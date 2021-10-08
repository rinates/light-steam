import clear from 'clear';
import * as fastq from 'fastq';
import type { queueAsPromised } from 'fastq';

import config, { ConfigAttributes } from '@/config';
import showSettings from '@/cli/interfaces/showSettings';
import initial from '@/cli/interfaces/initial';
import sleep from '@/cli/utils/sleep';
import FileManager from '@/plugins/FileManager';
import validator from '@/cli/utils/validator';
import SteamExecutor from '@/cli/components/SteamExecutor';
import AccountController, { LimitAttributes } from '@/cli/components/AccountController';

type Task = {
  action: string;
  account: string;
  toUseProxy: boolean;
  proxy: string | undefined;
  games: Array<string>;
};

interface ValidAccountAttributes {
  account: string;
  limitInfo: LimitAttributes;
  steamId: string | undefined;
}

const injector = async (args: Task): Promise<ValidAccountAttributes> => {
  const {
    action, account, toUseProxy, proxy, games,
  } = args;

  logger.info(`Starting to inject an account [${account}]`);

  const acc = await validator(account);
  const steamExecutor = new SteamExecutor(acc.login, acc.password);

  if (acc.email && acc.emailPassword) {
    await steamExecutor.setEmail(acc.email, acc.emailPassword);
  }

  if (toUseProxy && proxy) await steamExecutor.setProxy(proxy);

  await steamExecutor.login();

  const { steamId } = steamExecutor;
  const accountController = new AccountController(steamExecutor);
  const limitInfo = await accountController.checkAccountLimit();
  const removeRedTable = async (code: string) => {
    await accountController.setCode(code);
    const unlockStatus = await accountController.doAccountUnlock();

    if (!unlockStatus.success) throw new Error(unlockStatus.errorMsg);
  };

  await accountController.doSetPublicProfile();

  if (action === 'remove red table' && acc.code) {
    logger.info('Removing read table from the account');

    await removeRedTable(acc.code);
  }

  if (action === 'add games to the steam library') {
    logger.info('Add games to the steam library');

    await accountController.addGamesToLibrary(games);
  }

  if (action === 'all of the above' && acc.code) {
    logger.info('All of the above');

    await accountController.addGamesToLibrary(games);
    await removeRedTable(acc.code);
  }

  return {
    account,
    limitInfo,
    steamId,
  };
};

const executor = async (settings: ConfigAttributes) => {
  const fileManager = new FileManager();
  const accounts = await fileManager.getAccounts();
  const games = await fileManager.getGames();
  const {
    func, workers, toUseProxy, delay,
  } = settings;
  const q: queueAsPromised<Task> = fastq.promise(injector, workers);
  let proxies;
  let proxy;

  if (toUseProxy) {
    proxies = await fileManager.getProxies();
  }

  await fileManager.createResult();

  for (let i = 0; i < accounts.length; i += 1) {
    const account = accounts[i].trim();
    proxy = proxies ? proxies[proxies.length % i] : undefined;

    q
      .push({
        action: func,
        account,
        toUseProxy,
        proxy,
        games,
      })
      .then(async (value) => {
        await fileManager.appendToResult(value.account, value.limitInfo, value.steamId);
      })
      .catch((err) => {
        fileManager.appendToFailed(account);

        logger.error(err.message);
      });

    await sleep(delay);
  }
};

export default async () => {
  const settings: ConfigAttributes = await config();

  await clear();
  await initial();
  await showSettings(settings);
  await sleep(3);
  await clear();
  await executor(settings);
};
