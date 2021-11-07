import * as inquirer from 'inquirer';
import clear from 'clear';

import FileManager from '@/plugins/FileManager';
import { initial, start } from '@/cli/interfaces';

export default async (): Promise<void> => {
  const fileManager = new FileManager();
  await fileManager.checkDirsAndFiles();

  const callMenu = () => {
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
      {
        type: 'confirm',
        name: 'toRemoveGuard',
        message: 'Remove guard? (2fa email)',
        default: false,
      },
      {
        type: 'input',
        name: 'workers',
        message: 'How many workers do you want to use?',
        default: 1,
        filter(val) {
          return Number(val) || 1;
        },
      },
      {
        type: 'input',
        name: 'delay',
        message: 'What the delay to use before to start a script? (In seconds)',
        default: 10,
        filter(val) {
          return Number(val) || 10;
        },
      },
      {
        type: 'input',
        name: 'delayAfterCaptcha',
        message: 'What the delay to use after catch a captcha? (In seconds)',
        default: 100,
        filter(val) {
          return Number(val) || 100;
        },
      },
      {
        type: 'input',
        name: 'waitForAuthCode',
        message: 'What the delay to wait for an auth code? (In seconds)',
        default: 30,
        filter(val) {
          return Number(val) || 30;
        },
      },
    ]).then(async (answers) => {
      await fileManager.saveConfig(answers);

      await clear();
      await start();
    });
  };
  const askConfig = async () => {
    inquirer.prompt([
      {
        type: 'confirm',
        name: 'useConfig',
        message: 'Do you want to use config if it is exists?',
        default: false,
      },
    ]).then((answer) => {
      clear();

      if (answer.useConfig && fileManager.configExists()) {
        start();
      } else {
        initial();
        callMenu();
      }
    });
  };

  await askConfig();
};
