export default class RemoverUrlIsNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoverUrlIsNotFound';
  }
}
