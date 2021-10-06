export default class NoProxies extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoProxies';
  }
}
