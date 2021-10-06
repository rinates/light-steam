export default class MailIsNotInstalled extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailIsNotInstalled';
  }
}
