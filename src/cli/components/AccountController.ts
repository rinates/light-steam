import got from 'got';
import FormData from 'form-data';
import { CookieJar } from 'tough-cookie';

import SteamExecutor, { Login } from '@/cli/components/SteamExecutor';

interface PublicProfile {
  success: number,
  Privacy: any,

  [key: string]: any
}

export interface SteamUnlockStatus {
  success: boolean,
  errorMsg?: string,

  [key: string]: any
}

export default class AccountController {
  public steam: SteamExecutor;

  private cookieJar: CookieJar;

  private loginParams: Login | undefined;

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

  public async doSetPublicProfile(): Promise<PublicProfile> {
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
        cookieJar: this.steam.cookieJar,
        form,
        timeout: 5000,
      },
    ).json();

    return publicProfileResponse;
  }
}
