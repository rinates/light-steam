import * as inquirer from 'inquirer';

export default async (): Promise<void> => {
  inquirer.prompt([
    {
      type: 'list',
      name: 'func',
      message: 'Choose one of the functions:',
      choices: [
        'Add games to the steam library',
        'Remove red table',
        'All of the above',
      ],
      filter(val) {
        return val.toLowerCase();
      },
    },
    {
      type: 'confirm',
      name: 'toUseProxy',
      message: 'Do you want to use proxy?',
      default: false,
    },
  ]).then((answers) => {
    console.log(answers);
  });
};
