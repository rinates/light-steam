import clear from 'clear';

import config, { ConfigAttributes } from '@/config';
import showSettings from '@/cli/interfaces/showSettings';
import initial from '@/cli/interfaces/initial';
import delay from '@/cli/utils/delay';

export default async () => {
  const settings: ConfigAttributes = await config();

  await clear();
  await initial();
  await showSettings(settings);

  await delay(3);
  await clear();
};
