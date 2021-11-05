import { Cookie, CookieJar } from 'tough-cookie';
import { hex2b64, Key } from 'node-bignumber';
import crypto from 'crypto';
import got from 'got';
import { HttpsProxyAgent } from 'hpagent';
import FormData from 'form-data';

import rsaGenerator from '@/cli/utils/rsa';
import {
  CaptchaNeeded, EmailNeeded, FailedToLogin, NoSteamId, TimeoutGettingAuthCode,
} from '@/cli/errors';
import ImapController from '@/cli/components/ImapController';
import delay from '@/cli/utils/sleep';

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
  captcha_needed?: boolean,
  emailauth_needed?: boolean,

  [key: string]: any
}

export default class SteamExecutor implements SteamExecutorAttributes {
  public cookieJar: CookieJar = new CookieJar();
  public sessionId: string = SteamExecutor.generateSessionId();
  public username: string;
  public password: string;
  public email: string | undefined;
  public emailPassword: string | undefined;
  public loginParams: Login | undefined;
  public loginParamsHelp: Login | undefined;
  public steamId: string | undefined;
  public hasSteamGuard: boolean | undefined;
  private emailAuth: string | undefined;
  public proxyAgent: HttpsProxyAgent | undefined;
  private headers = { 'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7' }
  private steamUrls: Array<string> = [
    'https://steamcommunity.com',
    'https://store.steampowered.com',
    'https://help.steampowered.com',
  ];

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  private static generateSessionId(): string {
    return crypto.randomBytes(12).toString('hex');
  }

  public async login() {
    for (let i = 1; i < 6; i += 1) {
      logger.info(`[${i}/5] attempt to login [${this.email}]`);

      try {
        this.loginParams = await this.sendLoginRequest();
        this.loginParams = await this.checkGuard(this.loginParams);
        this.loginParamsHelp = await this.sendLoginRequestHelp();
        this.loginParamsHelp = await this.checkGuard(this.loginParamsHelp);

        if (this.loginParams && this.loginParamsHelp) {
          await SteamExecutor.checkCaptcha(this.loginParams);
          await SteamExecutor.checkCaptcha(this.loginParamsHelp);
          await SteamExecutor.assertValid(this.loginParams);
          await SteamExecutor.assertValid(this.loginParamsHelp);
          await this.performRedirects(this.loginParams);
          await this.setSessionId();
          await this.setSteamID();
          await this.setProfileSettings();

          logger.info(`Success login [${this.email}]`);

          return;
        }
      } catch (e) { logger.error(e); }

      await delay(60);
    }

    logger.info('Login was failed, duo some reasons. Let\'s rest to the proxies for 10 minutes');

    await delay(60 * 10);

    throw new FailedToLogin(`Failed to login [${this.email}]`);
  }

  private async sendLoginRequestHelp() {
    logger.info(`Send login help request [${this.username}]`);

    await got('https://help.steampowered.com/', {
      headers: this.headers,
      cookieJar: this.cookieJar,
      timeout: 5000,
    });

    const params = await this.prepareParams();
    const form = new FormData();

    Object.entries(params).forEach((entry) => {
      const [key, value] = entry;

      form.append(key, value);
    });

    const loginResponse: Login = await got.post(
      'https://help.steampowered.com/en/login/dologin/',
      {
        headers: this.headers,
        cookieJar: this.cookieJar,
        body: form,
        followRedirect: true,
        timeout: 10000,
        agent: {
          https: this.proxyAgent,
        },
      },
    ).json();

    return loginResponse;
  }

  private async sendLoginRequest() {
    logger.info(`Send login request [${this.username}]`);

    await got('https://steamcommunity.com/', { cookieJar: this.cookieJar, timeout: 5000 });

    const params = await this.prepareParams();
    const form = new FormData();

    Object.entries(params).forEach((entry) => {
      const [key, value] = entry;

      form.append(key, value);
    });

    const loginResponse: Login = await got.post(
      'https://steamcommunity.com/login/dologin/',
      {
        headers: this.headers,
        cookieJar: this.cookieJar,
        body: form,
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
    logger.info(`Prepare params to do login request [${this.username}]`);

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
    logger.info(`Encrypt password [${this.username}]`);

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

  private async setSteamID() {
    logger.info(`Set steam id [${this.username}]`);

    if (this.loginParams) {
      this.steamId = this.loginParams.transfer_parameters.steamid;
    }

    if (!this.steamId) {
      throw new NoSteamId('Something wrong. Failed to get a steam id');
    }
  }

  private async setSessionId() {
    logger.info(`Set session id for all domains [${this.username}]`);

    this.steamUrls.forEach((url) => {
      const cookies = Cookie.parse(`sessionid=${this.sessionId}; Domain=${url.substring(8)}; Path=/`);

      // @ts-ignore
      this.cookieJar.store.putCookie(cookies, () => {});
    });
  }

  private static async assertValid(params: Login): Promise<void> {
    if (!params.success) {
      throw new Error(params.message || 'Failed to login');
    }
  }

  private static async checkCaptcha(params: Login): Promise<void> {
    if (params.captcha_needed) {
      throw new CaptchaNeeded('You have to change proxy. There is a captcha');
    }
  }

  public setEmail(email: string, password: string) {
    this.email = email;
    this.emailPassword = password;
  }

  private async performRedirects(params: Login): Promise<void> {
    const form = new FormData(params.transfer_parameters);
    const urls = params.transfer_urls;

    for (const url of urls) {
      await got.post(
        url,
        {
          cookieJar: this.cookieJar,
          form,
          followRedirect: true,
          timeout: 5000,
          agent: {
            https: this.proxyAgent,
          },
        },
      );
    }
  }

  private async checkGuard(params: Login): Promise<Login | undefined> {
    logger.info(`Check guard [${this.username}]`);

    if (params.emailauth_needed) {
      this.hasSteamGuard = true;

      if (this.email && this.emailPassword) {
        const mail: ImapController = new ImapController(this.email, this.emailPassword);

        await mail.setMailSettings();
        await mail.setConnection();

        for (let i = 0; i < 20; i += 1) {
          logger.info(`Getting auth code [${this.email}]`);

          await delay(3);

          const uids = await mail.getAllUids();
          const lastMail = await mail.getMail(uids[0]);
          const code = await mail.getCode(lastMail);

          if (code) {
            this.emailAuth = code;

            await mail.closeConnection();

            return this.sendLoginRequest();
          }
        }

        throw new TimeoutGettingAuthCode('Timeout to get an auth code');
      }

      throw new EmailNeeded('Add an email if you have this one');
    }

    return this.loginParams;
  }

  public async setProfileSettings(): Promise<void> {
    logger.info(`Set profile (default settings) [${this.username}]`);

    await got(
      `https://steamcommunity.com/profiles/${this.steamId}/edit?welcomed=1`,
      {
        cookieJar: this.cookieJar,
        followRedirect: true,
        timeout: 5000,
      },
    );
  }

  public async setProxy(proxy: string): Promise<void> {
    logger.info(`Settings proxy ${proxy}`);

    let proxyArgs: string | Array<string> = proxy.split(':');

    if (proxyArgs.length === 4) {
      proxyArgs = `${proxyArgs.slice(2).join(':')}@${proxyArgs.slice(0, 2).join(':')}`;
    } else {
      proxyArgs = proxy;
    }

    this.proxyAgent = new HttpsProxyAgent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 256,
      maxFreeSockets: 256,
      proxy: `http://${proxyArgs}`,
    });
  }
}
