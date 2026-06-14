require('dotenv').config();
const mongoose = require('mongoose');
const Newsletter = require('../src/models/Newsletter.model');
const sendEmail = require('../src/utils/email.utils');

// ==========================================
// CONFIGURATION DE VOTRE MESSAGE ICI
// ==========================================
const NEWSLETTER_SUBJECT = "Nouvel outil disponible sur paperFlow ! 🔥";
const NEWSLETTER_HTML = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #e11d48; text-align: center;">paperFlow</h1>
        <p>Bonjour cher utilisateur,</p>
        <p>Nous avons le plaisir de vous annoncer qu'un <strong>nouvel outil PDF</strong> vient d'être ajouté à notre plateforme !</p>
        <p>Grâce à vos retours, nous avons également amélioré la vitesse de traitement de tous nos outils existants.</p>
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://paperflow.app" style="background: #e11d48; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Découvrir les nouveautés
            </a>
        </div>
        <p style="font-size: 12px; color: #999;">
            Vous recevez cet email car vous êtes inscrit à la newsletter de paperFlow.<br>
            Pour ne plus recevoir d'emails, <a href="#">cliquez ici</a>.
        </p>
    </div>
`;
// ==========================================

const sendToAll = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connecté à la base pour l\'envoi de la newsletter... 📨');

        const subscribers = await Newsletter.find({ isActive: true });
        
        if (subscribers.length === 0) {
            console.log('Aucun abonné actif trouvé.');
            process.exit(0);
        }

        console.log(`Envoi en cours à ${subscribers.length} abonnés...`);

        // Envoi en boucle
        for (const sub of subscribers) {
            try {
                await sendEmail({
                    email: sub.email,
                    subject: NEWSLETTER_SUBJECT,
                    html: NEWSLETTER_HTML
                });
                console.log(`✅ Envoyé à: ${sub.email}`);
            } catch (err) {
                console.error(`❌ Échec pour: ${sub.email}`, err.message);
            }
        }

        console.log('\n--- Envoi terminé ! ---');
        process.exit(0);
    } catch (err) {
        console.error('Erreur générale:', err);
        process.exit(1);
    }
};

sendToAll();
