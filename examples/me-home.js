/**
 * This is a simple automation to turn on all the lights when you come home
 */

while (true) {
  // This will wait for single state change event, see hass trigger documentation
  await hass.waitForTrigger({
    platform: 'state',
    entity_id: 'device_tracker.your_phone',
    to: 'home',
  });

  // Check that sun is below horizon
  const sun = await hass.getEntity('sun.sun');
  if (sun.state !== 'below_horizon') {
    continue;
  }

  // Turn on some lights
  await hass.callService('light.turn_on', {
    entity_id: 'light.all_lights_group',
  });
}
