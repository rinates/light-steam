export default class NoSteamId extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoSteamId';
  }
}
