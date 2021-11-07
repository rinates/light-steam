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
  delay: number;
  delayAfterCaptcha: number;
  waitForAuthCode: number;
  account: string;
  toUseProxy: boolean;
  toRemoveGuard: boolean;
  proxy: string | undefined;
  games: Array<string>;
};

interface ValidAccountAttributes {
  reformAccount: string;
  limitInfo: LimitAttributes;
  steamId: string | undefined;
}

const injector = async (args: Task): Promise<ValidAccountAttributes> => {
  const {
    action, delay, delayAfterCaptcha,
    waitForAuthCode, account, toUseProxy,
    toRemoveGuard, proxy, games,
  } = args;

  await sleep(delay);

  logger.info(`Starting to inject an account [${account}]`);

  const acc = await validator(account);
  const steamExecutor = new SteamExecutor(acc.login, acc.password);
  const reformAccount = `${acc.login}:${acc.password}${acc.email && acc.emailPassword ? `:${acc.email}:${acc.emailPassword}` : ''}`;

  if (acc.email && acc.emailPassword) {
    await steamExecutor.setEmail(acc.email, acc.emailPassword);
  }

  if (toUseProxy && proxy) await steamExecutor.setProxy(proxy);

  await steamExecutor.setDelayAfterCaptcha(delayAfterCaptcha);
  await steamExecutor.setWaitForAuthCode(waitForAuthCode);
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
    logger.info('Removing red table from the account');

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

  if (toRemoveGuard) await accountController.removeSteamGuard();

  return {
    reformAccount,
    limitInfo,
    steamId,
  };
};

const executor = async (settings: ConfigAttributes) => {
  const fileManager = new FileManager();
  const accounts = await fileManager.getAccounts();
  const games = await fileManager.getGames();
  const {
    func, workers, toUseProxy, toRemoveGuard, delay, delayAfterCaptcha, waitForAuthCode,
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
    proxy = proxies ? proxies[proxies.length % (i + 1)] : undefined;

    q
      .push({
        action: func,
        delay,
        delayAfterCaptcha,
        waitForAuthCode,
        account,
        toUseProxy,
        toRemoveGuard,
        proxy,
        games,
      })
      .then(async (value) => {
        await fileManager.appendToResult(value.reformAccount, value.limitInfo, value.steamId);
      })
      .catch((err) => {
        fileManager.appendToFailed(account);

        logger.error(err.message);
      });
  }
};

export default async () => {
  const settings = await config();

  await clear();
  await initial();
  await showSettings(settings.Settings);
  await sleep(3);
  await clear();
  await executor(settings.Settings);
};
