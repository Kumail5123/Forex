/**
 * Sends push notifications via Expo's push service. Works with any device
 * running the Expo Go app or a built app that registered an Expo push token
 * — no Firebase/APNs setup needed for development.
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */
async function sendPushNotification(expoPushToken, { title, body, data = {} }) {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error('Failed to send push notification:', err.message);
  }
}

module.exports = { sendPushNotification };
