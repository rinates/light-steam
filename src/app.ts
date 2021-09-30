import './plugins/moduleAlias';
import '@/plugins/winston';
import cli from '@/cli';

(async () => {
  await cli();
})();
