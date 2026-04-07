const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `Motorbike Rental <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.email);
    return true;
  } catch (error) {
    console.error('CRITICAL EMAIL ERROR:', error.message);
    // Continue process even if email fails in dev context so user isn't stuck
    return false;
  }
};

module.exports = sendEmail;
