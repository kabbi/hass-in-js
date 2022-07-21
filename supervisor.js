import { config as configureEnv } from 'dotenv';
import createDebug from 'debug';

import { setupHassConnection } from './utils/hass.js';
import { setupFileWatcher } from './utils/watcher.js';

const debug = createDebug('supervisor');

configureEnv();

// Hack to exit with Ctrl+C when run inside docker container
process.on('SIGINT', function () {
  process.exit();
});

await setupHassConnection();
await setupFileWatcher();
debug('startup done');
