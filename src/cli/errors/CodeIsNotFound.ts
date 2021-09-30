export default class CodeIsNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Code is not found';
  }
}