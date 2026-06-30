const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send an email
 * @param {Object} mailOptions
 * @param {string} mailOptions.to - Recipient email
 * @param {string} mailOptions.subject - Email subject
 * @param {string} [mailOptions.template] - EJS template filename (optional)
 * @param {string} [mailOptions.data] - Data for template rendering (optional)
 * @param {string} [mailOptions.html] - HTML body (optional, used if template not provided)
 * @param {string} [mailOptions.text] - Plain text body (optional)
 */
const sendEmail = async ({ to, subject, template, data, html, text }) => {
    try {

        // console.log("inside of email ")
        let htmlContent = html;

        // If template is provided, render it
        if (template) {
            const templatePath = path.join(__dirname, '../views/emails/', template);
            htmlContent = await ejs.renderFile(templatePath, data || {});
        }

        const mailOptions = {
            from: `${process.env.APP_NAME} <${process.env.SMTP_USER}>`, // Sender address
            to,
            subject
        };

        // Add text if provided
        if (text) {
            mailOptions.text = text;
        }

        // Add html if available
        if (htmlContent) {
            mailOptions.html = htmlContent;
        }

        // console.log(mailOptions)
        const info = await transporter.sendMail(mailOptions);
        // console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendEmail };
