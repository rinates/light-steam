export default class EmailNeeded extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Email needed';
  }
}
