import { promises as fs } from 'fs';

export interface ConfigAttributes {
  func: string;
  toUseProxy: boolean;
  workers: number;
  delay: number;
}

export default async () => {
  const cfg: ConfigAttributes = JSON.parse(await fs.readFile(`${process.cwd()}/config/default.json`, 'utf-8')).Settings;

  return cfg;
};
