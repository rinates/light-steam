import clear from 'clear';

import config, { ConfigAttributes } from '@/config';
import showSettings from '@/cli/interfaces/showSettings';
import initial from '@/cli/interfaces/initial';

export default async () => {
  const settings: ConfigAttributes = config();

  clear();
  await initial();
  await showSettings(settings);
};
