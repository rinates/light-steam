import figlet from 'figlet';
import chalk from 'chalk';
import menu from './menu';

export default async (): Promise<void> => {
  figlet('light stream', {
    font: 'Standard',
  }, async (err, data) => {
    if (err) {
      logger.error(err);

      return;
    }

    console.log([
      chalk.green(data),
      `${' '.repeat(17)}${chalk.green(chalk.bold('Development @rinaigen'))}`,
      `${' '.repeat(16)}${chalk.gray('Last update: xx.xx.xxxx')}`,
      '',
    ].join('\n'));

    await menu();
  });
};
