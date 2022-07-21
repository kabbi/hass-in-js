import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
} from 'home-assistant-js-websocket';
import createDebug from 'debug';
import WebSocket from 'ws';

// Hass needs that
global.WebSocket = WebSocket;

const debug = createDebug('supervisor');

let connection;
let entities = {};

export const setupHassConnection = async () => {
  const auth = createLongLivedTokenAuth(
    process.env.HASS_URL,
    process.env.HASS_TOKEN,
  );

  let resolve;
  const entitiesPromise = new Promise((r) => {
    resolve = r;
  });

  connection = await createConnection({ auth });

  // Keep our list of entities updated
  subscribeEntities(connection, (e) => {
    entities = e;
    resolve();
  });

  // Wait for initial entities, so that first scripts will already have all entities
  await entitiesPromise;

  debug('connected to hass');
};

// Methods awailable to workers via message passing
const getEntity = async (id) => {
  return entities[id];
};

const callHassService = async (service, data) => {
  const [domain, method] = service.split('.');
  await callService(connection, domain, method, data);
};

const waitForTrigger = async (trigger) => {
  let resolve = null;
  let promise = new Promise((r) => {
    resolve = r;
  });

  const unsubscribe = await connection.subscribeMessage(resolve, {
    type: 'subscribe_trigger',
    trigger,
  });

  const result = await promise;
  unsubscribe();
  return result;
};

// Whoa, this is some hard ass async stuff
const waitForTriggers = async (triggerMap) => {
  const triggers = Object.entries(triggerMap);

  let resolves = {};
  const unsubscribes = [];
  let promises = triggers.map(
    ([id]) =>
      new Promise((r) => {
        resolves[id] = r;
      }),
  );

  for (const [id, trigger] of triggers) {
    const unsubscribe = await connection.subscribeMessage(
      () => {
        resolves[id](id);
      },
      {
        type: 'subscribe_trigger',
        trigger,
      },
    );
    unsubscribes.push(unsubscribe);
  }

  const result = await Promise.race(promises);
  for (const unsubscribe of unsubscribes) {
    unsubscribe();
  }

  return result;
};

const exportedMethods = {
  get_entity: getEntity,
  call_service: callHassService,
  wait_for_trigger: waitForTrigger,
  wait_for_triggers: waitForTriggers,
};

export const registerWorker = (worker) => {
  worker.on('message', async (message) => {
    if (!exportedMethods[message.method]) {
      worker.postMessage({ id: message.id, error: 'No such method' });
      return;
    }

    try {
      const method = exportedMethods[message.method];
      const result = await method(...message.arguments);
      worker.postMessage({ id: message.id, result });
    } catch (error) {
      worker.postMessage({ id: message.id, error });
    }
  });
};
