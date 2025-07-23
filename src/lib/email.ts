
'use server';

import { getFirebaseAdmin } from './firebase/server';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendEmail(mailOptions: MailOptions) {
  const { db } = getFirebaseAdmin();
  const fromEmail = process.env.SMTP_FROM_EMAIL;

  if (!fromEmail) {
    console.error('SMTP_FROM_EMAIL is not configured. Cannot send email.');
    // In a real app, you might want to throw an error or handle this more gracefully
    return;
  }
  
  const mailCollection = db.collection('mail');
  try {
    await mailCollection.add({
      to: [mailOptions.to],
      message: {
        subject: mailOptions.subject,
        text: mailOptions.text,
        html: mailOptions.html,
      },
      from: `"CodeAlchemist" <${fromEmail}>`,
    });
  } catch (error) {
     console.error('Failed to write email document to Firestore:', error);
     throw new Error('Failed to queue email for sending.');
  }
}

export async function sendPendingApprovalEmail(userEmail: string, userName: string) {
  const mailOptions: MailOptions = {
    to: userEmail,
    subject: 'Your CodeAlchemist Account is Pending Approval',
    text: `Hi ${userName},\n\nThank you for signing up for CodeAlchemist. Your account is currently pending approval from an administrator. You will receive another email once your account has been activated.\n\nBest,\nThe CodeAlchemist Team`,
    html: `<p>Hi ${userName},</p><p>Thank you for signing up for CodeAlchemist. Your account is currently pending approval from an administrator. You will receive another email once your account has been activated.</p><p>Best,<br/>The CodeAlchemist Team</p>`,
  };
  await sendEmail(mailOptions);
}

export async function sendNewUserAdminNotification(adminEmail: string, newUserName: string, newUserEmail: string) {
  const mailOptions: MailOptions = {
    to: adminEmail,
    subject: 'New User Needs Approval',
    text: `A new user has signed up and requires approval.\n\nName: ${newUserName}\nEmail: ${newUserEmail}\n\nPlease visit the user management dashboard to approve or deny their request.`,
    html: `<p>A new user has signed up and requires approval.</p><ul><li><strong>Name:</strong> ${newUserName}</li><li><strong>Email:</strong> ${newUserEmail}</li></ul><p>Please visit the user management dashboard to approve or deny their request.</p>`,
  };
  await sendEmail(mailOptions);
}

export async function sendApprovalConfirmationEmail(userEmail: string, userName: string) {
    const mailOptions: MailOptions = {
        to: userEmail,
        subject: 'Your CodeAlchemist Account is Approved!',
        text: `Hi ${userName},\n\nYour CodeAlchemist account has been approved! You can now log in and access all the features.\n\nBest,\nThe CodeAlchemist Team`,
        html: `<p>Hi ${userName},</p><p>Your CodeAlchemist account has been approved! You can now log in and access all the features.</p><p>Best,<br/>The CodeAlchemist Team</p>`,
    };
    await sendEmail(mailOptions);
}
