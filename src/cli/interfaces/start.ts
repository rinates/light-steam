import figlet from 'figlet';
import chalk from 'chalk';

export default (): void => {
  figlet('light stream', {
    font: 'Standard',
  }, (err, data) => {
    if (err) {
      logger.error(err);

      return;
    }

    console.log([
      chalk.green(data),
      '',
      `${' '.repeat(17)}${chalk.green(chalk.bold('Development @rinaigen'))}`,
      '',
    ].join('\n'));
  });
};
