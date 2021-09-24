import got from 'got';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'hpagent';

export default async (
  username: string,
  proxyAgent: HttpsProxyAgent | undefined,
): Promise<unknown> => {
  const params: FormData = new FormData();

  params.append('username', username);

  return got.post(
    'https://store.steampowered.com/login/getrsakey',
    {
      form: params,
      timeout: 10000,
      agent: {
        // @ts-ignore
        https: proxyAgent,
      },
    },
  ).json();
};
