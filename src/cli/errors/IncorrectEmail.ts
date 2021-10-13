export default class IncorrectEmail extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IncorrectEmail';
  }
}
