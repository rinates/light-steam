export default class FailedToLogin extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FailedToLogin';
  }
}
