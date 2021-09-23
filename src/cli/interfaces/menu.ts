import * as inquirer from 'inquirer';

export default () => {
  inquirer.prompt([
    {
      type: 'List',
      name: 'theme',
      message: 'Choose one of the functions:',
      choices: [
        'Add games to the steam library',
        'Remove red table',
      ],
    },
  ]).then((answer) => {
    console.log(answer);
  });
};
