import { CookieJar } from 'tough-cookie';
import { hex2b64, Key } from 'node-bignumber';
import crypto from 'crypto';
import got from 'got';
import { HttpsProxyAgent } from 'hpagent';
import FormData from 'form-data';

import rsaGenerator from '@/cli/utils/rsa';
import ImapController from '@/cli/components/ImapController';
import { CodeIsNotFound, EmailNeeded, NoSteamId } from '@/cli/errors';

interface SteamExecutorAttributes {
  username: string;
  password: string;
}

interface Encrypt {
  encryptPassword: string,
  timestamp: string
}

export interface Login {
  success: boolean,
  // eslint-disable-next-line camelcase
  captcha_needed?: boolean,
  // eslint-disable-next-line camelcase
  emailauth_needed?: boolean,

  [key: string]: any
}

export default class SteamExecutor implements SteamExecutorAttributes {
  public cookieJar: CookieJar = new CookieJar();

  public sessionId: string = SteamExecutor.generateSessionId();

  public loginParams: Login | undefined;

  private email: string | undefined;

  private emailPassword: string | undefined;

  private emailAuth: string | undefined;

  private proxyAgent: HttpsProxyAgent | undefined;

  public steamId: string | undefined;

  public username: string;

  public password: string;

  private steamUrls: Array<string> = [
    'https://steamcommunity.com',
    'https://store.steampowered.com',
    'https://help.steampowered.com',
  ];

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  private static generateSessionId() {
    return crypto.randomBytes(12).toString('hex');
  }

  public async login() {
    this.loginParams = await this.sendLoginRequest();
  }

  private async sendLoginRequest() {
    await got('https://steamcommunity.com/', { cookieJar: this.cookieJar });

    const params = await this.prepareParams();
    const form = new FormData();

    Object.entries(params).forEach((entry) => {
      const [key, value] = entry;

      form.append(key, value);
    });

    const loginResponse: Login = await got(
      'https://steamcommunity.com/login/dologin/',
      {
        method: 'POST',
        cookieJar: this.cookieJar,
        form,
        followRedirect: true,
        timeout: 10000,
        agent: {
          https: this.proxyAgent,
        },
      },
    ).json();

    return loginResponse;
  }

  private async prepareParams() {
    const rsaEncryptedData = await this.encryptPassword();

    return {
      username: this.username,
      password: rsaEncryptedData.encryptPassword,
      rsatimestamp: rsaEncryptedData.timestamp,
      remember_login: 'true',
      emailauth: this.emailAuth || '',
      donotcache: Date.now(),
    };
  }

  private async encryptPassword(): Promise<Encrypt> {
    return rsaGenerator(this.username, this.proxyAgent)
      .then((data: any) => {
        const rsa = new Key();
        rsa.setPublic(data.publickey_mod, data.publickey_exp);
        const encryptData: Encrypt = {
          encryptPassword: hex2b64(rsa.encrypt(this.password)),
          timestamp: data.timestamp,
        };

        return encryptData;
      })
      .catch((err: string) => {
        throw new Error(err);
      });
  }

  private async checkGuard(params: Login): Promise<Login | undefined> {
    if (params.emailauth_needed) {
      if (this.email && this.emailPassword) {
        const mail: ImapController = new ImapController(this.email, this.emailPassword);

        mail.setMailSettings('imap.mail.ru', 993);
        await mail.setConnection();

        const setDelay = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        let code: string | null | undefined;

        for (let i = 0; i < 20; i += 1) {
          await setDelay(3 * 3000);
          const uids: Array<number> = await mail.getAllUids();
          code = await mail.getCode(uids[0]);

          if (code) {
            this.emailAuth = code;

            return this.sendLoginRequest();
          }
        }

        throw CodeIsNotFound;
      } else {
        throw EmailNeeded;
      }
    }

    return this.loginParams;
  }

  public setEmail(email: string, emailPassword: string) {
    this.email = email;
    this.emailPassword = emailPassword;
  }

  private async setSteamID() {
    let steamId: string | undefined;

    if (this.loginParams) {
      steamId = this.loginParams.transfer_parameters.steamid;
    }

    if (!steamId) {
      throw NoSteamId;
    }

    this.steamId = steamId;
  }
}
