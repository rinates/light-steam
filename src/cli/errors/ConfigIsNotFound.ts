export default class ConfigIsNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigIsNotFound';
  }
}
