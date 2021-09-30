import { start, menu } from '@/cli/interfaces';

export default async () => {
  await start();
  await menu();
};
