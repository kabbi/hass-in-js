/**
 * This blink program is like a `Hello, world!` from hardware programming
 * Probably not very useful in home automation, but who knows?
 * Replace `light.blinking` with the id of any lights from your hass setup
 */

while (true) {
  // To make any modification in hass world, you `call a service`. You can check
  // the list of available services in home assistant web ui, on
  // Developer tools -> Services page
  await hass.callService('light.toggle', {
    entity_id: 'light.blinking',
  });

  // This is 1s delay
  await delay(1000);
}
