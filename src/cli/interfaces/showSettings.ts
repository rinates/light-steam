import chalk from 'chalk';

import { ConfigAttributes } from '@/config';

export default async (settings: ConfigAttributes): Promise<void> => {
  console.log([
    `${' '.repeat(18)}${chalk.bold(chalk.gray('{'))}   ${chalk.bold(chalk.greenBright('Settings'))}   ${chalk.bold(chalk.gray('}'))}`,
    `${chalk.bold(' To do')}: ${chalk.yellow(settings.func)}`,
    `${chalk.bold(' Use proxy')}: ${settings.toUseProxy ? chalk.green(settings.toUseProxy) : chalk.red(settings.toUseProxy)}`,
    `${chalk.bold(' Workers')}: ${chalk.yellow(settings.workers)}`,
    `${chalk.bold(' Delay')}: ${chalk.yellow(`${settings.delay}s`)}`,
  ].join('\n'));
};
