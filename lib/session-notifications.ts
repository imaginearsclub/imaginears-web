/**
 * Session Notification System
 * 
 * Sends alerts for:
 * - New device logins
 * - Suspicious activity
 * - Location changes
 * - Security events
 */

import { prisma } from './prisma';

export interface SessionNotification {
  type: 'new_device' | 'new_location' | 'suspicious_activity' | 'security_alert';
  userId: string;
  sessionId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data: Record<string, any>;
  channels: ('email' | 'push' | 'sms')[];
}

/**
 * Send notification for new device login
 */
export async function notifyNewDevice(params: {
  userId: string;
  sessionId: string;
  deviceName: string;
  location: string;
  ip: string;
  timestamp: Date;
}) {
  const { userId, sessionId, deviceName, location, ip, timestamp } = params;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  
  if (!user?.email) return;
  
  const notification: SessionNotification = {
    type: 'new_device',
    userId,
    sessionId,
    title: 'New Device Login Detected',
    message: `A new device "${deviceName}" logged into your account from ${location} (${ip}) at ${timestamp.toLocaleString()}.`,
    severity: 'info',
    data: {
      deviceName,
      location,
      ip,
      timestamp,
    },
    channels: ['email'],
  };
  
  await sendNotification(notification, user.email, user.name || 'User');
}

/**
 * Send notification for new location
 */
export async function notifyNewLocation(params: {
  userId: string;
  sessionId: string;
  deviceName: string;
  previousLocation: string;
  newLocation: string;
  timestamp: Date;
}) {
  const { userId, sessionId, deviceName, previousLocation, newLocation, timestamp } = params;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  
  if (!user?.email) return;
  
  const notification: SessionNotification = {
    type: 'new_location',
    userId,
    sessionId,
    title: 'New Location Detected',
    message: `Your device "${deviceName}" was accessed from a new location: ${newLocation} (previously: ${previousLocation}) at ${timestamp.toLocaleString()}.`,
    severity: 'warning',
    data: {
      deviceName,
      previousLocation,
      newLocation,
      timestamp,
    },
    channels: ['email'],
  };
  
  await sendNotification(notification, user.email, user.name || 'User');
}

/**
 * Send notification for suspicious activity
 */
export async function notifySuspiciousActivity(params: {
  userId: string;
  sessionId: string;
  activityType: string;
  details: string;
  deviceName: string;
  location: string;
  timestamp: Date;
}) {
  const { userId, sessionId, activityType, details, deviceName, location, timestamp } = params;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  
  if (!user?.email) return;
  
  const notification: SessionNotification = {
    type: 'suspicious_activity',
    userId,
    sessionId,
    title: '🚨 Suspicious Activity Detected',
    message: `Suspicious activity detected on your account: ${activityType}. Details: ${details}. Device: "${deviceName}" from ${location} at ${timestamp.toLocaleString()}.`,
    severity: 'critical',
    data: {
      activityType,
      details,
      deviceName,
      location,
      timestamp,
    },
    channels: ['email'],
  };
  
  await sendNotification(notification, user.email, user.name || 'User');
}

/**
 * Send security alert notification
 */
export async function notifySecurityAlert(params: {
  userId: string;
  sessionId: string;
  alertType: string;
  message: string;
  actionRequired?: string;
  timestamp: Date;
}) {
  const { userId, sessionId, alertType, message, actionRequired, timestamp } = params;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  
  if (!user?.email) return;
  
  const notification: SessionNotification = {
    type: 'security_alert',
    userId,
    sessionId,
    title: `🔒 Security Alert: ${alertType}`,
    message: `${message}${actionRequired ? ` Action required: ${actionRequired}` : ''}`,
    severity: 'critical',
    data: {
      alertType,
      actionRequired,
      timestamp,
    },
    channels: ['email'],
  };
  
  await sendNotification(notification, user.email, user.name || 'User');
}

/**
 * Send notification via selected channels
 */
async function sendNotification(
  notification: SessionNotification,
  email: string,
  userName: string
) {
  // Send email notification
  if (notification.channels.includes('email')) {
    await sendEmailNotification(notification, email, userName);
  }
  
  // Send push notification
  if (notification.channels.includes('push')) {
    await sendPushNotification(notification);
  }
  
  // Send SMS notification
  if (notification.channels.includes('sms')) {
    await sendSMSNotification(notification);
  }
  
  // Log notification
  console.log(`[Notification] Sent ${notification.type} to user ${notification.userId}`);
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  notification: SessionNotification,
  email: string,
  userName: string
) {
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  // For now, just log
  
  const emailContent = generateEmailContent(notification, userName);
  
  console.log(`[Email] Sending to ${email}:`);
  console.log(emailContent);
  
  // TODO: Integrate with actual email service
  // await emailService.send({
  //   to: email,
  //   subject: notification.title,
  //   html: emailContent,
  // });
}

/**
 * Send push notification
 */
async function sendPushNotification(notification: SessionNotification) {
  // In production, integrate with push service (Firebase, OneSignal, etc.)
  console.log(`[Push] ${notification.title}: ${notification.message}`);
  
  // TODO: Integrate with actual push service
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(notification: SessionNotification) {
  // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`[SMS] ${notification.title}: ${notification.message}`);
  
  // TODO: Integrate with actual SMS service
}

/**
 * Generate HTML email content
 */
function generateEmailContent(notification: SessionNotification, userName: string): string {
  const severityColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  };
  
  const color = severityColors[notification.severity];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${notification.title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${userName},
              </p>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                ${notification.message}
              </p>
              
              ${notification.severity === 'critical' ? `
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                  ⚠️ Action Required
                </p>
                <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                  If this wasn't you, please secure your account immediately by changing your password and reviewing your active sessions.
                </p>
              </div>
              ` : ''}
              
              <!-- Data Table -->
              ${Object.keys(notification.data).length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
                ${Object.entries(notification.data).map(([key, value]) => `
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 14px; width: 40%;">
                    ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">
                    ${typeof value === 'object' ? JSON.stringify(value) : value}
                  </td>
                </tr>
                `).join('')}
              </table>
              ` : ''}
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/profile/security" 
                       style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Review Sessions
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                If you didn't perform this action or have concerns about your account security, 
                please contact support immediately.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                This is an automated security notification from Imaginears
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} Imaginears. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Get notification preferences for user
 */
export async function getNotificationPreferences(userId: string) {
  // In production, fetch from database
  // For now, return defaults
  return {
    emailEnabled: true,
    pushEnabled: false,
    smsEnabled: false,
    newDeviceAlerts: true,
    newLocationAlerts: true,
    suspiciousActivityAlerts: true,
    securityAlerts: true,
    weeklyReports: true,
  };
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<ReturnType<typeof getNotificationPreferences>>
) {
  // In production, save to database
  console.log(`[Notifications] Updated preferences for user ${userId}:`, preferences);
  
  return {
    ...await getNotificationPreferences(userId),
    ...preferences,
  };
}

/**
 * Send weekly security report
 */
export async function sendWeeklySecurityReport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  
  if (!user?.email) return;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  // Get session stats
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      createdAt: { gte: oneWeekAgo },
    },
    include: {
      activities: {
        where: {
          createdAt: { gte: oneWeekAgo },
        },
      },
    },
  });
  
  const stats = {
    totalLogins: sessions.length,
    uniqueDevices: new Set(sessions.map(s => s.deviceName)).size,
    uniqueLocations: new Set(sessions.map(s => `${s.country}-${s.city}`)).size,
    suspiciousSessions: sessions.filter(s => s.isSuspicious).length,
    totalActivity: sessions.reduce((acc, s) => acc + s.activities.length, 0),
  };
  
  const notification: SessionNotification = {
    type: 'security_alert',
    userId,
    sessionId: 'weekly_report',
    title: '📊 Weekly Security Report',
    message: `Here's your weekly account activity summary: ${stats.totalLogins} logins from ${stats.uniqueDevices} devices across ${stats.uniqueLocations} locations. ${stats.suspiciousSessions > 0 ? `⚠️ ${stats.suspiciousSessions} suspicious sessions detected.` : '✅ No suspicious activity detected.'}`,
    severity: stats.suspiciousSessions > 0 ? 'warning' : 'info',
    data: stats,
    channels: ['email'],
  };
  
  await sendNotification(notification, user.email, user.name || 'User');
}

