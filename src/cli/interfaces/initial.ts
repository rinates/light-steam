import chalk from 'chalk';

export default async (): Promise<void> => {
  const text = [
    '  _ _       _     _         _                       ',
    ' | (_) __ _| |__ | |_   ___| |_ ___  __ _ _ __ ___  ',
    ' | | |/ _` | \'_ \\| __| / __| __/ _ \\/ _` | \'_ ` _ \\ ',
    ' | | | (_| | | | | |_  \\__ \\ ||  __/ (_| | | | | | |',
    ' |_|_|\\__, |_| |_|\\__| |___/\\__\\___|\\__,_|_| |_| |_|',
    '      |___/                                         ',
  ].join('\n');

  console.log([
    chalk.green(text),
    `${' '.repeat(16)}${chalk.green(chalk.bold('Development @rinaigen'))}`,
    `${' '.repeat(15)}${chalk.gray('Last update: 13.10.2021')}`,
    '',
  ].join('\n'));
};
