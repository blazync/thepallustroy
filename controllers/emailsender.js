const nodemailer = require('nodemailer');
const Settings = require('../models/setting');

async function createTransporter() {
  try {
    // Fetch the settings from the database
    const settings = await Settings.findOne();
    // Create a transporter with SMTP settings
    const transporter = nodemailer.createTransport({
      // service:settings.smtp_service,
      host:settings.smtp_host,
      port:settings.smtp_port, 
      secure:settings.smtp_secure === 'true', 
      auth: {
        user:settings.smtp_user, 
        pass:settings.smtp_pass 
      },
      tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2' 
    }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw new Error('Failed to create email transporter');
  }
}

// Function to send email
async function sendMail(to, cc, bcc, subject, htmlContent) {
  try {
    // Create the transporter
    const transporter = await createTransporter();
    const settings = await Settings.findOne();
    // Set up mail options
 
    const mailOptions = {
      from: `The Pallu Story <${settings.from_email}>`,
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      html: `
<html>
<head>
  <style>
    /* Reset styles */
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      background-color: #f0f0f0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    header {
      text-align: center;
      margin-bottom: 20px;
    }
    header img {
      max-width: 150px;
      height: auto;
    }
    footer {
      text-align: center;
      margin-top: 20px;
    }
    footer a {
      margin: 0 10px;
      color: #333;
      text-decoration: none;
    }
    .social-links a img {
      width: 40px;
      height: 40px;
      vertical-align: middle;
    }
    .support {
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f0f0f0; margin: 0; padding: 0;">
  <div class="container">
    <header>
      <img src="${settings.email_image_url}" alt="Store Logo">
    </header>
    <p>${htmlContent}</p>
    <p>Feel free to contact us for support or any questions you may have.</p>
    <p>Contact us at <a href="mailto:${settings.email}">${settings.email}</a></p>
    <footer>
      <div class="social-links">
        <a href="${settings.facebook}"><img src="https://img.icons8.com/fluency/48/facebook-new.png" alt="Facebook"></a>
        <a href="${settings.twitter}"><img src="https://img.icons8.com/fluency/48/twitter.png" alt="Twitter"></a>
        <a href="${settings.instagram}"><img src="https://img.icons8.com/fluency/48/instagram-new.png" alt="Instagram"></a>
        <a href="${settings.whatsapp}"><img src="https://img.icons8.com/fluency/48/whatsapp.png" alt="WhatsApp"></a>
      </div>
      <p>Follow us on social media for updates!</p>
      <p><b>${settings.applicationName}</b></p>
      <p>${settings.email} | ${settings.contactNumber} | ${settings.address}</p>
    </footer>
  </div>
</body>
</html>
`

    };

    // Send mail
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

module.exports = sendMail;
