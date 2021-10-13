import * as imaps from 'imap-simple';
import { ImapSimple, ImapSimpleOptions } from 'imap-simple';
import { convert } from 'html-to-text';
import _ from 'lodash';

import {
  IncorrectEmail, MailIsNotFound, MailIsNotInstalled, DomainIsNotFound,
} from '@/cli/errors';
import config from '@/config';

export default class ImapController {
  public config: ImapSimpleOptions | undefined;

  public connection: ImapSimple | undefined;

  public email: string;

  public pass: string;

  constructor(email: string, pass: string) {
    this.email = email;
    this.pass = pass;
  }

  public async setMailSettings() {
    logger.info(`Set mail params [${this.email}]`);

    const settings = await config();
    const domain = this.email.match(/@.*/g);

    if (!domain) {
      throw new IncorrectEmail('Email is incorrect');
    }

    for (const host of Object.keys(settings.DefaultImap)) {
      const { port, domains } = settings.DefaultImap[host];

      if (domains.includes(domain[0])) {
        await this.setConfig(host, port);

        return;
      }
    }

    throw new DomainIsNotFound('Domain is not found in settings');
  }

  private async setConfig(host: string, port: number) {
    logger.info(`Set imap params [${host}:${port}] [${this.email}]`);

    this.config = {
      imap: {
        user: this.email,
        password: this.pass,
        host,
        port,
        tls: true,
        authTimeout: 3000,
      },
    };
  }

  public async setConnection(): Promise<void> {
    logger.info(`Trying to set connection [${this.email}]`);

    if (this.config) {
      this.connection = await imaps.connect(this.config)
        .then((connect) => connect)
        .catch(() => {
          throw new Error('Connection to imap failed. Try again in other time.');
        });
      await this.connection.openBox('INBOX');
    } else {
      throw new MailIsNotInstalled('Mail is not installed');
    }
  }

  public async closeConnection(): Promise<void> {
    this.connection?.end();
  }

  public async getMail(uid: number): Promise<string | null> {
    const searchCriteria = [['UID', uid]];
    const fetchOptions = {
      bodies: ['HEADER', ''],
      markSeen: false,
    };
    let messages: Array<any> | undefined;

    if (this.connection) {
      messages = await this.connection.search(searchCriteria, fetchOptions);

      if (messages.length === 0) {
        throw new MailIsNotFound('Mail is not found');
      }

      const fullBody: any = _.find(messages[0].parts, { which: '' });
      const messageBody = fullBody.body;
      const text = convert(messageBody, {
        wordwrap: 130,
      });

      return text;
    }

    return null;
  }

  public async getCode(text: string | null): Promise<string | null> {
    if (!text) {
      return text;
    }

    const code = text.trim().split('\n')[6].match(/\b([A-Z]|[0-9]){5}\b/g);

    return code ? code[0] : null;
  }

  public async getSteamGuardDisableUrl(text: string | null): Promise<string | null> {
    if (!text) {
      return text;
    }

    const url = text.match(/https:\/\/store.steampowered.com\/account\/steamguarddisableverification.*\b/g);

    return url ? url[0] : null;
  }

  private async searchWithoutFetch(searchCriteria: Array<Array<String>>): Promise<Array<number>> {
    // @ts-ignore
    const imapUnderlying: ImapSimple = this.connection.imap;

    return new Promise((resolve, reject) => {
      // @ts-ignore
      imapUnderlying.search(searchCriteria, (err: string, uids: Array<number>) => {
        if (err) {
          reject(err);
        } else {
          resolve(uids || []);
        }
      });
    });
  }

  public async getAllUids(): Promise<Array<number>> {
    const uids: Array<number> = await this.searchWithoutFetch([['!DELETED']]);

    return [...uids].sort((a, b) => b - a);
  }
}
