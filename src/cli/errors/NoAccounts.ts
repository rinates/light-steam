export default class NoAccounts extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoAccounts';
  }
}
