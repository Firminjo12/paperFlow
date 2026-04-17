const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const util = require('util');
const libre = require('libreoffice-convert');
const auth = require('../middleware/authMiddleware'); // auth JWT

// Remove util.promisify since libreoffice-convert returns a promise but requires a callback.
// We'll wrap it safely.
const convertFileAsync = (inputBuf, ext) => {
    return new Promise((resolve, reject) => {
        libre.convert(inputBuf, ext, undefined, (err, done) => {
            if (err) return reject(err);
            resolve(done);
        });
    });
};

const os = require('os');

// 4. Stockage temporaire avec Multer (cross-platform : Windows / Render)
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Validation basique anti-corruption
        if (file.mimetype === 'application/x-msdownload' || file.mimetype === 'application/x-sh') {
           return cb(new Error("Type de fichier non autorisé."));
        }
        cb(null, true);
    }
});

/**
 * Fonction générique pour la conversion via LibreOffice
 */
const handleConversion = (ext) => {
    return async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier fourni ou fichier trop volumineux (10MB max)." });
        }

        const inputPath = req.file.path;
        
        try {
            const inputBuf = fs.readFileSync(inputPath);
            const outputBuf = await convertFileAsync(inputBuf, ext);
            
            res.contentType(`application/${ext === '.pdf' ? 'pdf' : 'octet-stream'}`);
            
            // Ajouter un header de disposition pour déclencher le téléchargement avec un bon nom si possible
            const originalName = path.parse(req.file.originalname).name;
            res.setHeader('Content-Disposition', `attachment; filename="${originalName}${ext}"`);
            
            res.send(outputBuf);
            
        } catch (err) {
            console.error(`Erreur de conversion vers ${ext}:`, err);
            res.status(500).json({ message: "Erreur serveur lors de la conversion de haute qualité." });
        } finally {
            // Suppression immédiate de /tmp
            if (fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
            }
        }
    };
};

// ==========================================
// 3. ROUTES DE CONVERSIONS BÁSIC
// ==========================================
router.post('/word-to-pdf', upload.single('file'), handleConversion('.pdf'));
router.post('/pptx-to-pdf', upload.single('file'), handleConversion('.pdf'));
router.post('/excel-to-pdf', upload.single('file'), handleConversion('.pdf'));

// ==========================================
// ROUTES PREMIums (JWT Requis) 
// (Extraction depuis PDF complexe demandée vers Word/Excel/PPTX)
// ==========================================
router.post('/pdf-to-word', auth, upload.single('file'), handleConversion('.docx'));
router.post('/pdf-to-pptx', auth, upload.single('file'), handleConversion('.pptx'));
router.post('/pdf-to-excel', auth, upload.single('file'), handleConversion('.xlsx'));

const { execFile } = require('child_process');

// ==========================================
// 4. ROUTE DE DÉVERROUILLAGE (UNLOCK)
// ==========================================
router.post('/unlock', upload.single('file'), async (req, res) => {
    if (!req.file || !req.body.password) {
        return res.status(400).json({ message: "Le fichier et le mot de passe sont requis." });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `unlocked_${req.file.filename}.pdf`);

    const cleanPassword = req.body.password ? req.body.password.trim() : "";
    
    console.log("-----------------------------------------");
    console.log(`[DEBUG] Fichier : ${req.file.originalname}`);
    console.log(`[DEBUG] Mot de passe reçu : "${cleanPassword}"`);
    console.log(`[DEBUG] Longueur : ${cleanPassword.length}`);
    console.log("-----------------------------------------");

    // Utilisation de execFile pour une gestion sécurisée des arguments
    execFile('qpdf', [
        '--decrypt', 
        '--password', 
        cleanPassword, 
        '--suppress-recovery-mark',
        '--force-id', // Force le traitement même si l'ID du PDF est incohérent
        inputPath, 
        outputPath
    ], (error, stdout, stderr) => {
        // qpdf renvoie le code 3 pour "succès avec avertissements". On doit l'accepter.
        const isWarning = error && error.code === 3;
        
        if (error && !isWarning) {
            console.error('--- ERREUR DÉVERROUILLAGE PDF ---');
            console.error('Code Erreur:', error.code);
            console.error('Stderr:', stderr);
            
            cleanup();
            
            return res.status(401).json({ 
                message: "Échec du déverrouillage. Vérifiez le mot de passe.",
                detail: stderr
            });
        }

        if (isWarning) {
            console.warn('[QPDF WARNINGS] Le déverrouillage a réussi avec des alertes structurelles.');
        }

        try {
            if (!fs.existsSync(outputPath)) {
                throw new Error("Le fichier de sortie n'a pas été généré.");
            }
            const outputBuf = fs.readFileSync(outputPath);
            res.contentType('application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Unlocked_${req.file.originalname}"`);
            res.send(outputBuf);
        } catch (readErr) {
            console.error('Erreur récupération PDF:', readErr);
            res.status(500).json({ message: "Erreur lors de la récupération du fichier déverrouillé." });
        } finally {
            cleanup();
        }
    });

    const cleanup = () => {
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {}
    };
});

module.exports = router;
