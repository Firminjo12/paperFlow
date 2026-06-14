const Newsletter = require('../models/Newsletter.model');
const sendEmail = require('../utils/email.utils');

exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('--- Nouvelle tentative d\'inscription ---');
        console.log('Email reçu:', email);

        if (!email) {
            console.log('Erreur: Email manquant dans req.body');
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir une adresse email'
            });
        }

        // Vérifier si l'email existe déjà
        const existingSubscriber = await Newsletter.findOne({ email });
        console.log('Abonné existant ?', existingSubscriber ? 'Oui' : 'Non');
        let isReactivation = false;

        if (existingSubscriber) {
            if (existingSubscriber.isActive) {
                console.log('Refus: Email déjà actif');
                return res.status(400).json({
                    success: false,
                    message: 'Cet email est déjà inscrit à notre newsletter'
                });
            } else {
                // Réactiver si l'utilisateur s'était désinscrit
                existingSubscriber.isActive = true;
                existingSubscriber.subscribedAt = Date.now();
                await existingSubscriber.save();
                isReactivation = true;
            }
        } else {
            await Newsletter.create({ email });
        }

        // Envoyer email de bienvenue
        try {
            await sendEmail({
                email: email,
                subject: 'Bienvenue chez paperFlow ! 🚀',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h1 style="color: #e11d48; text-align: center;">paperFlow</h1>
                        <p style="font-size: 16px; color: #333;">Bonjour,</p>
                        <p style="font-size: 16px; color: #333;">Merci de vous être inscrit à la newsletter de <strong>paperFlow</strong> !</p>
                        <p style="font-size: 16px; color: #333;">Vous recevrez désormais en avant-première nos nouveaux outils PDF, nos astuces de productivité et nos mises à jour importantes.</p>
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                            <h2 style="margin: 0; color: #333;">Votre aventure commence ici.</h2>
                            <p style="color: #666;">Optimisez vos documents comme jamais auparavant.</p>
                        </div>
                        <p style="font-size: 14px; color: #999; text-align: center;">
                            Si vous n'êtes pas à l'origine de cette inscription, vous pouvez vous désinscrire à tout moment.
                        </p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error('Erreur envoi email bienvenue:', emailErr);
            // On ne bloque pas l'inscription si l'email échoue (ex: mauvaise config), 
            // mais on log l'erreur.
        }

        res.status(isReactivation ? 200 : 201).json({
            success: true,
            message: isReactivation ? 'Inscription réussie ! Ravi de vous revoir.' : 'Merci de votre inscription à notre newsletter !'
        });
    } catch (error) {
        console.error('Erreur Newsletter:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de l\'inscription'
        });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        const { email } = req.body;
        
        const subscriber = await Newsletter.findOne({ email });
        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Email non trouvé'
            });
        }

        subscriber.isActive = false;
        await subscriber.save();

        res.status(200).json({
            success: true,
            message: 'Vous avez été désinscrit avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la désinscription'
        });
    }
};

exports.sendBulk = async (req, res) => {
    try {
        const { subject, html } = req.body;

        if (!subject || !html) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir un sujet et un contenu'
            });
        }

        const subscribers = await Newsletter.find({ isActive: true });
        
        if (subscribers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun abonné actif trouvé'
            });
        }

        // --- Système de File d'attente intelligent ---
        // On ne veut pas tout envoyer d'un coup pour éviter le spam/saturation
        const BATCH_SIZE = 10; // 10 emails par lot
        const DELAY_BETWEEN_BATCHES = 5000; // 5 secondes de pause entre les lots

        res.status(200).json({
            success: true,
            message: `L'envoi de la newsletter à ${subscribers.length} abonnés a été lancé avec succès.`
        });

        // Fonction d'envoi en arrière-plan
        const processQueue = async () => {
            console.log(`--- Début du traitement de la newsletter (${subscribers.length} abonnés) ---`);
            
            for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
                const currentBatch = subscribers.slice(i, i + BATCH_SIZE);
                console.log(`Lot en cours : ${i} à ${i + currentBatch.length}...`);

                const promises = currentBatch.map(sub => 
                    sendEmail({
                        email: sub.email,
                        subject: subject,
                        html: html
                    }).catch(err => console.error(`Échec pour ${sub.email}:`, err.message))
                );

                await Promise.all(promises);

                if (i + BATCH_SIZE < subscribers.length) {
                    console.log(`Attente de ${DELAY_BETWEEN_BATCHES / 1000}s avant le prochain lot...`);
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                }
            }
            console.log('--- Traitement de la newsletter terminé avec succès ✅ ---');
        };

        // Lancer sans 'await' pour rendre la main au client immédiatement
        processQueue();

    } catch (error) {
        console.error('Erreur Envoi Bulk:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi groupé'
        });
    }
};


