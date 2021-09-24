import config from 'config';
import ConfigIsNotFound from '@/cli/errors/ConfigIsNotFound';

export interface ConfigAttributes {
  func: string;
  toUseProxy: boolean;
  workers: number;
  delay: number;
}

export default () => {
  try {
    return config.get('Settings') as ConfigAttributes;
  } catch (error) {
    throw new ConfigIsNotFound('There is not the config, you should create this one');
  }
};
