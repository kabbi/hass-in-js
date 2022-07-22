/**
 * Turn on all your lights an hour before sunset
 */

while (true) {
  // This will happen an hour before sunset
  await hass.waitForTrigger({
    platform: 'sun',
    event: 'sunset',
    offset: '-01:00:00',
  });

  // Get the group of all your lights
  const lights = await hass.getEntity('light.all_lights');

  // Turn on all the lights one by one (with 5min interval), works only for groups
  for (const entity_id of lights.attributes.entity_id) {
    await hass.callService('light.turn_on', { entity_id });
    await delay('5m');
  }
}
