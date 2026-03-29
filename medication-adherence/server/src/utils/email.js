const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Medication Adherence App" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

exports.sendGuardianInvitation = async (to, patientName, inviteToken) => {
  const inviteUrl = `${process.env.CLIENT_URL}/accept-invite/${inviteToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Guardian Invitation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Guardian Invitation</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p><strong>${patientName}</strong> has invited you to be their medication guardian.</p>
        <p>As a guardian, you will:</p>
        <ul>
          <li>Receive alerts when doses are missed</li>
          <li>View adherence reports</li>
          <li>Get notified about medication schedules</li>
        </ul>
        <p style="text-align: center;">
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><code>${inviteUrl}</code></p>
        <p>This link expires in 7 days.</p>
        <hr>
        <p><small>If you didn't request this invitation, please ignore this email.</small></p>
      </div>
      <div class="footer">
        <p>Medication Adherence App &copy; ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;

  return exports.sendEmail({
    to,
    subject: `Guardian Invitation from ${patientName}`,
    html
  });
};

exports.sendMissedDoseAlert = async (to, { patientName, medicationName, dosage, scheduledTime }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Missed Dose Alert</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: #dc3545;
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .button {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ Missed Dose Alert</h1>
      </div>
      <div class="content">
        <p><strong>Patient:</strong> ${patientName}</p>
        <p><strong>Medication:</strong> ${medicationName} (${dosage})</p>
        <p><strong>Scheduled Time:</strong> ${new Date(scheduledTime).toLocaleString()}</p>
        <p>This dose has been missed. Please check on ${patientName} to ensure they take their medication.</p>
        <p style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/dashboard" class="button">View Dashboard</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return exports.sendEmail({
    to,
    subject: `Missed Dose Alert: ${patientName} - ${medicationName}`,
    html
  });
};