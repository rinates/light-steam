import cli from './cli';
import './plugins/moduleAlias';

(async () => {
  await cli();
})();
