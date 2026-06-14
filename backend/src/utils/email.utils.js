const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Créer un transporteur
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // Mot de passe d'application Google
        }
    });

    // 2) Définir les options de l'email
    const mailOptions = {
        from: `paperFlow <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
    };

    // 3) Envoyer l'email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
