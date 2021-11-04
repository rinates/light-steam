import got from 'got';
import { CookieJar } from 'tough-cookie';
import { JSDOM } from 'jsdom';

import SteamExecutor, { Login } from '@/cli/components/SteamExecutor';
import ImapController from '@/cli/components/ImapController';
import delay from '@/cli/utils/sleep';
import { RemoverUrlIsNotFound } from '@/cli/errors';

interface PublicProfile {
  success: number,
  Privacy: any,

  [key: string]: any
}

export interface LimitAttributes {
  limit: boolean;
  balance: number;
}

export interface SteamUnlockStatus {
  success: boolean,
  errorMsg?: string,

  [key: string]: any
}

export default class AccountController {
  public steam: SteamExecutor;
  public cookieJar: CookieJar;
  public loginParams: Login | undefined;
  private code: string | undefined;

  constructor(steam: SteamExecutor) {
    this.steam = steam;
    this.cookieJar = steam.cookieJar;
    this.loginParams = steam.loginParams;
  }

  public setCode(code: string) {
    this.code = code;
  }

  public async doAccountUnlock(): Promise<SteamUnlockStatus> {
    logger.info(`Trying to unlock account [${this.steam.username}]`);

    const form = {
      unlockcode: this.code,
      sessionid: this.steam.sessionId,
      wizard_ajax: 1,
    };

    return got.post(
      'https://help.steampowered.com/ru/wizard/AjaxDoAccountUnlock',
      {
        cookieJar: this.cookieJar,
        form,
        timeout: 5000,
        agent: {
          https: this.steam.proxyAgent,
        },
      },
    ).json();
  }

  public async checkAccountLimit(): Promise<LimitAttributes> {
    logger.info(`Check account is limit or not (balance if it's) [${this.steam.username}]`);

    return got(
      'https://help.steampowered.com/',
      {
        cookieJar: this.cookieJar,
        timeout: 5000,
        agent: {
          https: this.steam.proxyAgent,
        },
      },
    )
      .then((response) => {
        const dom = new JSDOM(response.body);
        const balance = dom.window.document.querySelector('.help_event_limiteduser_spend span');

        const limitInfo: LimitAttributes = {
          limit: !!balance,
          balance: balance ? Number(String(balance.textContent).split('/')[0].trim().slice(1)) : 0,
        };

        return limitInfo;
      })
      .catch((err) => {
        throw new Error(err);
      });
  }

  public async doSetPublicProfile(): Promise<PublicProfile> {
    logger.info(`Set public profile settings (open profile if it's private) [${this.steam.username}]`);

    const form = {
      sessionid: this.steam.sessionId,
      Privacy: JSON.stringify(
        {
          PrivacyProfile: 3,
          PrivacyInventory: 3,
          PrivacyInventoryGifts: 3,
          PrivacyOwnedGames: 3,
          PrivacyPlaytime: 3,
          PrivacyFriendsList: 3,
        },
      ),
      eCommentPermission: 1,
    };

    const publicProfileResponse: PublicProfile = await got.post(
      `https://steamcommunity.com/profiles/${this.steam.steamId}/ajaxsetprivacy`,
      {
        cookieJar: this.cookieJar,
        form,
        timeout: 5000,
        agent: {
          https: this.steam.proxyAgent,
        },
      },
    ).json();

    return publicProfileResponse;
  }

  public async removeSteamGuard(): Promise<void> {
    logger.info(`Removing steam guard (if's on) [${this.steam.username}]`);

    if (!this.steam.hasSteamGuard) {
      logger.info(`The steam guard has already been disabled [${this.steam.username}]`);

      return;
    }

    const form = {
      action: 'actuallynone',
      sessionid: this.steam.sessionId,
    };

    await got.post(
      'https://store.steampowered.com/twofactor/manage_action',
      {
        cookieJar: this.cookieJar,
        form,
        timeout: 5000,
        agent: {
          https: this.steam.proxyAgent,
        },
      },
    );

    const removerUrl = await this.getSteamGuardRemoverUrl();

    if (!removerUrl) throw new RemoverUrlIsNotFound('Remover url is not found');

    const response = await got(
      removerUrl,
      {
        cookieJar: this.cookieJar,
        timeout: 5000,
        agent: {
          https: this.steam.proxyAgent,
        },
      },
    );

    if (response.statusCode === 200) {
      logger.info(`Steam guard has been disabled success [${this.steam.username}]`);
    } else {
      throw new Error(`Something wrong with connections. Status code: ${response.statusCode} [${this.steam.username}]`);
    }
  }

  private async getSteamGuardRemoverUrl(): Promise<string | null> {
    if (this.steam.email && this.steam.emailPassword) {
      const mail: ImapController = new ImapController(this.steam.email, this.steam.emailPassword);

      await mail.setMailSettings();
      await mail.setConnection();

      for (let i = 0; i < 20; i += 1) {
        logger.info(`Getting url to remove guard [${this.steam.email}]`);

        await delay(3);

        const uids = await mail.getAllUids();
        const lastMail = await mail.getMail(uids[0]);
        const url = await mail.getSteamGuardDisableUrl(lastMail);

        if (url) {
          await mail.closeConnection();

          logger.info(`Steam guard removed successful [${this.steam.username}]`);

          return url;
        }
      }
    }

    return null;
  }

  public async addGamesToLibrary(games: Array<string>): Promise<void> {
    for (const game of games) {
      const form = {
        action: 'add_to_cart',
        sessionid: this.steam.sessionId,
        subid: game,
      };

      logger.info(`Add game ${game} [${this.steam.username}]`);

      await got.post(
        'https://store.steampowered.com/checkout/addfreelicense',
        {
          cookieJar: this.cookieJar,
          form,
          timeout: 5000,
          agent: {
            https: this.steam.proxyAgent,
          },
        },
      );
    }
  }
}
