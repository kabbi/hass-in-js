import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import createDebug from 'debug';
import chokidar from 'chokidar';

import { registerWorker } from './hass.js';

const debug = createDebug('supervisor');

const workers = {};

const loadScript = (path) => {
  if (workers[path]) {
    return;
  }

  const absolutePath = join(process.cwd(), path);
  workers[path] = new Worker('./utils/entry.js', {
    workerData: { path: absolutePath },
  });

  workers[path].on('error', (error) => {
    debug('worker error', path, error);
  });

  registerWorker(workers[path]);
};

const unloadScript = (path) => {
  if (!workers[path]) {
    return;
  }

  workers[path].terminate();
  delete workers[path];
};

export const setupFileWatcher = async () => {
  chokidar.watch('scripts/**/*.js').on('all', (event, path) => {
    debug('file event', event, path);

    if (event === 'add') {
      loadScript(path);
    }
    if (event === 'change') {
      unloadScript(path);
      loadScript(path);
    }
    if (event === 'unlink') {
      unloadScript(path);
    }
  });
};
