import {useEffect} from 'react';
import {Platform} from 'react-native';
import * as Notifications from 'expo-notifications';

const REMINDER_IDENTIFIER = 'daily-transaction-reminder';
const REMINDER_ENABLED = false;

export const useDailyTransactionReminder = () => {
  useEffect(() => {
    if (!REMINDER_ENABLED) {
      return;
    }

    let mounted = true;

    const configureReminder = async () => {
      try {
        const settings = await Notifications.getPermissionsAsync();
        let status = settings.status;
        if (status !== 'granted') {
          const request = await Notifications.requestPermissionsAsync();
          status = request.status;
        }

        if (status !== 'granted' || !mounted) {
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync(
            'transaction-reminders',
            {
              name: 'Transaction Reminders',
              importance: Notifications.AndroidImportance.DEFAULT,
              vibrationPattern: [0, 200, 150, 200],
              lightColor: '#00AEEF',
            },
          );
        }

        const scheduled =
          await Notifications.getAllScheduledNotificationsAsync();
        const hasReminder = scheduled.some(
          reminder => reminder.identifier === REMINDER_IDENTIFIER,
        );

        if (!hasReminder) {
          await Notifications.scheduleNotificationAsync({
            identifier: REMINDER_IDENTIFIER,
            content: {
              title: "Did you log today's transactions?",
              body: 'Quick check keeps your budget on track.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority.DEFAULT,
            },
            trigger: {
              hour: 21,
              minute: 0,
              repeats: true,
            },
          });
        }
      } catch (error) {
        console.log('Failed to configure transaction reminder', error);
      }
    };

    configureReminder();

    return () => {
      mounted = false;
    };
  }, []);
};
