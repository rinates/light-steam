import { promises as fs } from 'fs';

export interface ConfigAttributes {
  func: string;
  toUseProxy: boolean;
  toRemoveGuard: boolean;
  workers: number;
  delay: number;
}

export default async () => JSON.parse(await fs.readFile(`${process.cwd()}/config/default.json`, 'utf-8'));
