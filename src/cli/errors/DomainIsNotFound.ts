export default class DomainIsNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainIsNotFound';
  }
}
