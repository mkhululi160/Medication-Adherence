const webpush = require('web-push');

webpush.setVapidDetails(
  `mailto:${process.env.EMAIL_USER}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.sendPushNotification = async (subscription, payload) => {
  try {
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('Push notification error:', error);
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { expired: true };
    }
    throw error;
  }
};

exports.sendMissedDosePush = (subscription, { patientName, medicationName, scheduledTime }) => {
  return exports.sendPushNotification(subscription, {
    title: 'Missed Dose Alert',
    body: `${patientName} missed ${medicationName} at ${new Date(scheduledTime).toLocaleTimeString()}`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: '/dashboard',
      patientName,
      medicationName
    },
    actions: [
      { action: 'view', title: 'View Dashboard' }
    ]
  });
};

exports.sendReminderPush = (subscription, { patientName, medicationName, scheduledTime }) => {
  return exports.sendPushNotification(subscription, {
    title: 'Medication Reminder',
    body: `${patientName}, time to take ${medicationName}`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: '/scan',
      medicationName
    },
    actions: [
      { action: 'scan', title: 'Scan QR Code' }
    ]
  });
};