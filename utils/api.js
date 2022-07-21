import { parentPort } from 'node:worker_threads';
import { nanoid } from 'nanoid';
import moment from 'moment';
import ms from 'ms';

// Just a convenient date manipulation library
global.moment = moment;

// Global delay helper, accepts both numbers and strings (100, '2h')
global.delay = (time) =>
  new Promise((resolve) => {
    if (typeof time === 'string') {
      time = ms(time);
    }
    setTimeout(resolve, time);
  });

// Some random assorted utils
global.utils = {
  async waitForTime(time) {
    const target = moment(time);
    await delay(target - Date.now());
  },

  parseDeviceTrigger(id) {
    const [device_id, discovery_id, action] = id.split('.');
    const [type, ...subtypes] = action.split('_');
    return {
      device_id,
      discovery_id: `${discovery_id} ${action}`,
      platform: 'device',
      domain: 'mqtt',
      type: type,
      subtype: subtypes.join('_'),
    };
  },
};

// Async rpc helper
const callMethod = (method, ...args) =>
  new Promise((resolve, reject) => {
    const id = nanoid();
    parentPort.postMessage({ id, method, arguments: args });

    const listener = (message) => {
      if (message?.id !== id) {
        return;
      }

      if (message.result || !message.error) {
        resolve(message.result);
      }

      if (message.error) {
        reject(message.error);
      }

      parentPort.off('message', listener);
    };

    parentPort.on('message', listener);
  });

// Pass method calls to hass module in main thread
global.hass = {
  async getEntity(id) {
    const entity = await callMethod('get_entity', id);
    return entity;
  },

  async callService(service, data) {
    await callMethod('call_service', service, data);
  },

  async waitForTrigger(trigger) {
    await callMethod('wait_for_trigger', trigger);
  },

  async waitForTriggers(triggerMap) {
    const triggerId = await callMethod('wait_for_triggers', triggerMap);
    return triggerId;
  },
};
