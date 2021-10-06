export default class AccountInvalid extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountInvalid';
  }
}
