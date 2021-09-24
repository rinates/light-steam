import figlet from 'figlet';
import chalk from 'chalk';

export default async (): Promise<void> => {
  const text = figlet.textSync('light steam', {
    font: 'Standard',
  });

  console.log([
    chalk.green(text),
    `${' '.repeat(16)}${chalk.green(chalk.bold('Development @rinaigen'))}`,
    `${' '.repeat(15)}${chalk.gray('Last update: xx.xx.xxxx')}`,
    '',
  ].join('\n'));
};
