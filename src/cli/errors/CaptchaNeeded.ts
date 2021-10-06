export default class CaptchaNeeded extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaptchaNeeded';
  }
}
