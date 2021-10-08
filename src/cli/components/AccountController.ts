import got from 'got';
import FormData from 'form-data';
import { CookieJar } from 'tough-cookie';
import { JSDOM } from 'jsdom';

import SteamExecutor, { Login } from '@/cli/components/SteamExecutor';

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

    const form = new FormData();
    form.append('unlockcode', this.code);
    form.append('sessionid', this.steam.steamId);
    form.append('wizard_ajax', 1);

    return got.post(
      'https://help.steampowered.com/ru/wizard/AjaxDoAccountUnlock',
      {
        cookieJar: this.cookieJar,
        form,
        timeout: 5000,
        agent: {
          // @ts-ignore
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
          // @ts-ignore
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
          // @ts-ignore
          https: this.steam.proxyAgent,
        },
      },
    ).json();

    return publicProfileResponse;
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
            // @ts-ignore
            https: this.steam.proxyAgent,
          },
        },
      );
    }
  }
}
