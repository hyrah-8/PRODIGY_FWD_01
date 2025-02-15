import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', 
    port: 587, 
    secure: false,  // Must be false for STARTTLS
    requireTLS: true,  // Force TLS encryption
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false  // Prevents self-signed SSL issues
    }
});

export default transporter;
