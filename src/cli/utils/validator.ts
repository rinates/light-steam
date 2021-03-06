import { AccountInvalid } from '@/cli/errors';

export interface AccountAttributes {
  login: string;
  password: string;
  email: string;
  emailPassword: string;
  code: string;
}

export default async (account: string): Promise<AccountAttributes> => {
  const accountList = account.split(':');
  const acc: AccountAttributes = {
    login: '',
    password: '',
    email: '',
    emailPassword: '',
    code: '',
  };

  if (accountList.length === 2) {
    [acc.login, acc.password] = accountList;

    return acc;
  }

  if (accountList.length === 3) {
    [acc.login, acc.password, acc.code] = accountList;

    return acc;
  }

  if (accountList.length === 4) {
    [acc.login, acc.password, acc.email, acc.emailPassword] = accountList;

    return acc;
  }

  if (accountList.length >= 5 && accountList.length <= 10) {
    [acc.login, acc.password, acc.email, acc.emailPassword] = accountList;
    acc.code = accountList[accountList.length - 1];

    return acc;
  }

  throw new AccountInvalid('Account valid error');
};
