/**
 * This script will wait for any of the two button presses on some remote (like ikea tradfri),
 * and will either turn the light green, or run rainbow effect (if it supports that)
 *
 * All device IDs here are fake, substitute with your ones
 */

while (true) {
  // Advanced stuff - this will fire when any (first) thing happen from the list
  const button = await hass.waitForTriggers({
    // I know this looks kinda ugly, but you just copy that from hass gui
    // This is a general syntax for device events, like button presses on remotes, etc
    button1: {
      device_id: 'd8ec58b141e5c0670c880bd03b7db44a',
      discovery_id: `0xcc86ecfffe984376 action_on`,
      platform: 'device',
      domain: 'mqtt',
      type: 'action',
      subtype: 'on',
    },
    button2: {
      device_id: 'd8ec58b141e5c0670c880bd03b7db44a',
      discovery_id: `0xcc86ecfffe984376 action_off`,
      platform: 'device',
      domain: 'mqtt',
      type: 'action',
      subtype: 'off',
    },
  });

  if (button === 'button1') {
    await hass.callService('light.turn_on', {
      effect: 'Rainbow',
      entity_id: 'light.my_light',
    });
  }

  if (button === 'button2') {
    await hass.callService('light.turn_on', {
      color: 'green',
      entity_id: 'light.my_light',
    });
  }
}
