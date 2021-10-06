export default class NoGames extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoGames';
  }
}
