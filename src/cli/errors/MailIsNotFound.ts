export default class MailIsNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailIsNotFound';
  }
}
