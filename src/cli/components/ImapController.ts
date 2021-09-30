import * as imaps from 'imap-simple';
import { convert } from 'html-to-text';
import _ from 'lodash';
import { ImapSimple, ImapSimpleOptions } from 'imap-simple';

import { CodeIsNotFound, MailIsNotInstalled } from '@/cli/errors';

export default class ImapController {
  public config: ImapSimpleOptions | undefined;

  public connection: ImapSimple | undefined;

  public email: string;

  public pass: string;

  constructor(email: string, pass: string) {
    this.email = email;
    this.pass = pass;
  }

  public async setMailSettings(host: string, port: number) {
    logger.info(`Set mail params [${this.email}]`);

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
      this.connection = await imaps.connect(this.config);
      await this.connection.openBox('INBOX');
    } else {
      throw MailIsNotInstalled;
    }
  }

  public async getCode(uid: number): Promise<string | null> {
    const searchCriteria = [['UID', uid]];
    const fetchOptions = {
      bodies: ['HEADER', ''],
      markSeen: false,
    };
    let messages: Array<any> | undefined;

    if (this.connection) {
      messages = await this.connection.search(searchCriteria, fetchOptions);

      if (messages.length === 0) {
        throw CodeIsNotFound;
      }

      const fullBody: any = _.find(messages[0].parts, { which: '' });
      const messageBody = fullBody.body;
      const text = convert(messageBody, {
        wordwrap: 130,
      });
      // @ts-ignore
      const code: string | null = text.trim().split('\n')[6].match(/\b([A-Z]|[0-9]){5}\b/g)[0] || null;

      return code || null;
    }

    return null;
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
