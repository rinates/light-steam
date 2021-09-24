declare module 'node-bignumber' {
  function hex2b64(h: string): string;

  class Key {
    public setPublic(N: string, E: string): void

    public encrypt(text: string): string
  }
}
