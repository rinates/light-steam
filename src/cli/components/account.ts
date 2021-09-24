import { CookieJar } from 'tough-cookie';
import { hex2b64, Key } from 'node-bignumber';
import crypto from 'crypto';
import got from 'got';
import { HttpsProxyAgent } from 'hpagent';
import FormData from 'form-data';

import rsaGenerator from '@/cli/utils/rsa';

interface SteamExecutorAttributes {
  username: string;
  password: string;
}

interface Encrypt {
  encryptPassword: string,
  timestamp: string
}

interface Login {
  success: boolean,
  // eslint-disable-next-line camelcase
  captcha_needed?: boolean,
  // eslint-disable-next-line camelcase
  emailauth_needed?: boolean,

  [key: string]: any
}

class SteamExecutor implements SteamExecutorAttributes {
  public cookieJar: CookieJar = new CookieJar();

  public sessionId: string = SteamExecutor.generateSessionId();

  public username

  public password;

  private emailauth: string | undefined;

  private loginParams: Login | undefined;

  private proxyAgent: HttpsProxyAgent | undefined;

  private steamUrls: Array<string> = [
    'https://steamcommunity.com',
    'https://store.steampowered.com',
    'https://help.steampowered.com',
  ];

  private static generateSessionId() {
    return crypto.randomBytes(12).toString('hex');
  }

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
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
      emailauth: this.emailauth || '',
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
}

export default SteamExecutor;
