import ConfigIsNotFound from '@/cli/errors/ConfigIsNotFound';
import ProxyIsNotFound from '@/cli/errors/ProxyIsNotFound';
import CaptchaNeeded from '@/cli/errors/CaptchaNeeded';
import EmailNeeded from '@/cli/errors/EmailNeeded';
import TimeoutGettingAuthCode from '@/cli/errors/TimeoutGettingAuthCode';

export default {
  ConfigIsNotFound,
  ProxyIsNotFound,
  CaptchaNeeded,
  EmailNeeded,
  TimeoutGettingAuthCode,
};
