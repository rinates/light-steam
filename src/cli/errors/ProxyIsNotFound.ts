export default class ProxyIsNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProxyIsNotFound';
  }
}
