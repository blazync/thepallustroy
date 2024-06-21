const nodemailer = require('nodemailer');
const Settings = require('../models/setting');

async function createTransporter() {
  try {
    // Fetch the settings from the database
    const settings = await Settings.findOne().exec();
    console.log(settings.user);

    // Create a transporter using the email configuration from the settings
    return nodemailer.createTransport({
      service: settings.service,
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: settings.pass,
      },
    });
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
    // Fetch the settings again to get the application name
    const settings = await Settings.findOne().exec();

    // Set up mail options
    const mailOptions = {
      from: `"${settings.applicationName}" <${settings.user}>`,
      to: to,
      cc: cc,
      bcc: bcc,
      subject: `${subject} - ${settings.applicationName}`,
    html: `
      <html>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <style>
          body {
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
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
            width: 150px;
            height: auto;
          }
          footer {
            text-align: center;
            margin-top: 20px;
          }
          footer a {
            margin: 0 10px;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <img src="" alt="Store Logo">
          </header>
          <p>${htmlContent}</p>
          <p>Feel free to contact us for support or any questions you may have.</p>
          <div class="support">
            <p>Contact us at <a href="mailto:blazync@gmail.com">blazync@gmail.com</a></p>
          </div>
          <footer>
            <a href="#"><img src='../social/facebook.png' width="40px"></a>
            <a href="#"><img src='../social/twitter.png' width="40px"></a>
            <a href="#"><img src='../social/instagram.png' width="40px"></i></a>
            <a href="#"><img src='../social/whatsapp.png' width="40px"></i></a>
            <p>Follow us on social media for updates!</p>
          </footer>
        </div>
      </body>
      </html>
      `,
    };

    // Send mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendMail;
