export default class TimeoutGettingAuthCode extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutGettingAuthCode';
  }
}
