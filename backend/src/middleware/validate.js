const { body, validationResult } = require('express-validator');

// Middleware générique pour vérifier les résultats de validation
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return res.status(400).json({
        success: false,
        message: "Erreur de validation des données",
        errors: extractedErrors
    });
};

// Règles de validation pour l'inscription à la newsletter
exports.newsletterRules = [
    body('email')
        .isEmail().withMessage('Veuillez fournir un email valide')
        .normalizeEmail()
        .trim(),
    validate
];

// Règles pour l'envoi groupé (Admin)
exports.bulkNewsletterRules = [
    body('subject').notEmpty().withMessage('Le sujet est requis').trim(),
    body('html').notEmpty().withMessage('Le contenu du message est requis'),
    validate
];

// Règles pour le Login
exports.loginRules = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').notEmpty().withMessage('Mot de passe requis'),
    validate
];

// Règles pour l'Auth (Register)
exports.registerRules = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères'),
    body('full_name').notEmpty().withMessage('Le nom est requis').trim(),
    validate
];
