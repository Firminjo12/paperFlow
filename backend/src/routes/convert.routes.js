const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const util = require('util');
const libre = require('libreoffice-convert');
const auth = require('../middleware/authMiddleware');


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

const extractPdfText = async (buffer) => {
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
        const result = await parser.getText();
        return result.text || "";
    } finally {
        await parser.destroy();
    }
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
            console.log(`[CONVERT] Début de la conversion vers ${ext} (${req.file.size} octets)...`);
            
            const start = Date.now();
            const outputBuf = await convertFileAsync(inputBuf, ext);
            const duration = Date.now() - start;
            
            console.log(`[CONVERT] Conversion terminée avec succès en ${duration}ms`);
            
            res.contentType(`application/${ext === '.pdf' ? 'pdf' : 'octet-stream'}`);
            
            // Ajouter un header de disposition pour déclencher le téléchargement avec un bon nom si possible
            const originalName = path.parse(req.file.originalname).name;
            res.setHeader('Content-Disposition', `attachment; filename="${originalName}${ext}"`);
            
            res.send(outputBuf);
            
        } catch (err) {
            console.error(`!!! ERREUR CONVERSION [${ext}] !!!`);
            console.error("Détails de l'erreur :", err);
            res.status(500).json({ 
                message: "Erreur serveur lors de la conversion de haute qualité.",
                error: err.message 
            });
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
// ==========================================
// ROUTES PREMIUMS (JWT Requis) 
// (Extraction depuis PDF complexe demandée vers Word/Excel/PPTX)
// ==========================================

// Route générique pour conversions robustes via CLI
const performCliConversion = (targetExt, inFilter, outFilter) => {
    return async (req, res) => {
        if (!req.file) return res.status(400).json({ message: "Aucun fichier fourni." });

        const inputPath = req.file.path;
        const outputDir = os.tmpdir();
        const originalName = path.parse(req.file.originalname).name;
        
        // Si c'est du PDF vers Word, on utilise la méthode de reconstruction de flux (Flow)
        // pour ÉVITER les zones de texte LibreOffice.
        if (targetExt === 'docx' && req.file.mimetype === 'application/pdf') {
            return await performStructuralConversion(req, res, inputPath, outputDir, originalName);
        }

        console.log(`[CONVERT-CLI] Début conversion ${targetExt} pour: ${req.file.originalname}`);
        const { exec } = require('child_process');
        const filterPart = outFilter ? `${targetExt}:"${outFilter}"` : targetExt;
        const sofficeCmd = getSofficePath();
        const cmd = `${sofficeCmd} --headless --infilter="${inFilter}" --convert-to ${filterPart} --outdir "${outputDir}" "${inputPath}"`;

        exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[CONVERT-CLI] Erreur ${targetExt}:`, error);
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                return res.status(500).json({ message: `La conversion ${targetExt} a échoué.`, error: stderr || error.message });
            }

            try {
                const generatedPath = path.join(outputDir, `${path.parse(req.file.filename).name}.${targetExt}`);
                
                if (!fs.existsSync(generatedPath)) {
                    throw new Error("Fichier de sortie non généré.");
                }

                const outputBuf = fs.readFileSync(generatedPath);
                
                res.contentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="${originalName}.${targetExt}"`);
                res.send(outputBuf);

                if (fs.existsSync(generatedPath)) fs.unlinkSync(generatedPath);
            } catch (err) {
                console.error("[CONVERT-CLI] Erreur lecture:", err);
                res.status(500).json({ message: "Erreur lors de la récupération du fichier converti." });
            } finally {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            }
        });
    };
};

/**
 * MOTEUR DE RECONSTRUCTION DE FLUX (Anti-Zones de texte)
 */
const performStructuralConversion = async (req, res, inputPath, outputDir, originalName) => {
    try {
        console.log(`[CONVERT-FLOW] Début de reconstruction de flux pour: ${originalName}`);
        const buffer = fs.readFileSync(inputPath);
        
        // Extraction du texte avec structuration basique
        const text = await extractPdfText(buffer);

        // 2. Nettoyage et Reconstruction intelligente
        // On essaye de détecter les titres et les listes pour un rendu plus riche
        const paragraphs = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        let htmlBody = "";
        
        paragraphs.forEach(p => {
            // Nettoyage des caractères de contrôle et ligatures PDF qui causent des soulignements
            const cleanP = p.replace(/[\u0000-\u001F\u007F-\u009F\u00AD]/g, "")
                            .replace(/\s+/g, ' '); // Fusionner les espaces doubles
            
            // Détection basique de structure
            if (cleanP.length < 60 && cleanP === cleanP.toUpperCase() && cleanP.length > 3) {
                // Probablement un titre (Très court et en majuscules)
                htmlBody += `<h2 style="margin-top: 20pt; margin-bottom: 10pt; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;">${cleanP}</h2>\n`;
            } else if (/^(\d+\.|\-|\u2022|\*)/.test(cleanP)) {
                // Détection de liste (Commence par un chiffre, un tiret ou une puce)
                htmlBody += `<p style="margin-left: 25pt; margin-bottom: 8pt; line-height: 1.4; font-family: 'Segoe UI', Arial, sans-serif;">${cleanP}</p>\n`;
            } else {
                // Paragraphe standard
                htmlBody += `<p style="margin-bottom: 12pt; line-height: 1.6; font-family: 'Segoe UI', Arial, sans-serif; text-align: justify;">${cleanP}</p>\n`;
            }
        });
        
        // Ajout de la définition de langue pour éviter les soulignements rouges (orthographe) dans Word
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr-FR">
        <head>
            <meta charset="UTF-8">
            <meta name="Content-Language" content="fr-FR">
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 50pt; }
            </style>
        </head>
        <body lang="fr-FR">
            ${htmlBody}
        </body>
        </html>`;

        const tempHtmlPath = path.join(outputDir, `${req.file.filename}.html`);
        const libreOfficeProfilePath = path.join(outputDir, `${req.file.filename}_lo_profile`);
        const libreOfficeProfileUri = `file:///${libreOfficeProfilePath.replace(/\\/g, '/')}`;
        fs.writeFileSync(tempHtmlPath, htmlContent);

        const sofficeCmd = getSofficeExecutablePath();
        const args = [
            '--headless',
            '--invisible',
            '--nodefault',
            '--nolockcheck',
            '--nologo',
            '--nofirststartwizard',
            `-env:UserInstallation=${libreOfficeProfileUri}`,
            '--convert-to',
            'docx:Office Open XML Text',
            '--outdir',
            outputDir,
            tempHtmlPath
        ];

        execFile(sofficeCmd, args, (error, stdout, stderr) => {
            const cleanup = () => {
                if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
                if (fs.existsSync(path.join(outputDir, `${req.file.filename}.docx`))) fs.unlinkSync(path.join(outputDir, `${req.file.filename}.docx`));
                if (fs.existsSync(libreOfficeProfilePath)) fs.rmSync(libreOfficeProfilePath, { recursive: true, force: true });
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            };

            if (error) {
                console.error('[CONVERT-FLOW] Erreur soffice:', error);
                console.error('[CONVERT-FLOW] stderr:', stderr);
                cleanup();

                if (error.code === 'ENOENT') {
                    return res.status(500).json({
                        message: "LibreOffice n'est pas installé sur le serveur ou la commande soffice est introuvable.",
                        error: error.message
                    });
                }

                return res.status(500).json({
                    message: "Échec de la reconstruction du flux.",
                    error: error.message
                });
            }

            try {
                const generatedPath = path.join(outputDir, `${req.file.filename}.docx`);
                const outputBuf = fs.readFileSync(generatedPath);

                res.contentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="${originalName}.docx"`);
                res.send(outputBuf);
            } catch (readErr) {
                console.error('[CONVERT-FLOW] Erreur lecture du fichier généré:', readErr);
                return res.status(500).json({
                    message: "Erreur lors de la lecture du fichier converti.",
                    error: readErr.message
                });
            } finally {
                cleanup();
            }
        });

    } catch (err) {
        console.error("[CONVERT-FLOW] Erreur:", err);
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        res.status(500).json({
            message: "Échec de la reconstruction du flux.",
            error: err.message
        });
    }
};

// Utilisation d'un filtre Office Open XML plus moderne pour favoriser le flux de texte
router.post('/pdf-to-word', auth, upload.single('file'), performCliConversion('docx', 'writer_pdf_import', 'MS Word 2007 XML'));

router.post('/pdf-to-pptx', auth, upload.single('file'), performCliConversion('pptx', 'impress_pdf_import', 'Impress MS PowerPoint 2007 XML'));
router.post('/pdf-to-excel', auth, upload.single('file'), performCliConversion('xlsx', 'calc_pdf_import', 'Calc MS Excel 2007 XML'));

const { execFile } = require('child_process');

// Détection du chemin LibreOffice (soffice)
const getSofficePath = () => {
    if (process.platform === "win32") {
        return '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
    }
    return 'soffice';
};

const getSofficeExecutablePath = () => {
    if (process.platform === "win32") {
        return 'C:\\Program Files\\LibreOffice\\program\\soffice.com';
    }
    return 'soffice';
};


// Détection du chemin QPDF (Local Windows vs Docker/Linux)
const getQpdfPath = () => {
    if (process.platform === "win32") {
        // Chemin spécifié par l'utilisateur pour son installation locale
        return '"C:\\Program Files\\qpdf 12.3.2\\bin\\qpdf.exe"';
    }
    return 'qpdf';
};

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
    console.log("-----------------------------------------");

    const { exec } = require('child_process');
    const qpdfCmd = getQpdfPath();
    
    // Commande simplifiée pour une compatibilité maximale entre versions
    const cmd = `${qpdfCmd} --decrypt --password="${cleanPassword}" "${inputPath}" "${outputPath}"`;

    exec(cmd, (error, stdout, stderr) => {
        const isWarning = error && error.code === 3;
        
        if (error && !isWarning) {
            console.error('--- ERREUR DÉVERROUILLAGE PDF ---');
            console.error('Erreur complete:', error);
            console.error('Stderr:', stderr);
            console.error('Stdout:', stdout);
            
            cleanup();
            
            if (error.code === 'ENOENT') {
                return res.status(500).json({
                    message: "L'outil interne QPDF n'est pas installé ou introuvable sur le serveur.",
                    detail: error.message
                });
            }

            return res.status(401).json({ 
                message: "Échec du déverrouillage. Vérifiez le mot de passe ou le fichier.",
                detail: stderr || stdout || error.message
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

// ==========================================
// 5. ROUTE DE RÉPARATION (REPAIR)
// ==========================================
router.post('/repair', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Le fichier est requis." });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `repaired_${req.file.filename}.pdf`);

    const qpdfCmd = getQpdfPath();
    const { exec } = require('child_process');
    
    // QPDF répare automatiquement les fichiers lorsqu'il les réécrit
    const cmd = `${qpdfCmd} "${inputPath}" "${outputPath}"`;

    exec(cmd, (error, stdout, stderr) => {
        // QPDF renvoie souvent des exit codes non-nuls (1, 2, 3) pour des erreurs mineures/warnings
        // On vérifie si le fichier de sortie a bien été généré malgré tout
        const success = fs.existsSync(outputPath);
        
        if (error && !success) {
            console.error('--- ERREUR RÉPARATION PDF ---');
            console.error(stderr || error.message);
            cleanup();
            return res.status(500).json({ 
                message: "Échec de la récupération. Le fichier est peut-être trop corrompu pour être réparé automatiquement.",
                error: stderr || error.message 
            });
        }

        try {
            const outputBuf = fs.readFileSync(outputPath);
            res.contentType('application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Repaired_${req.file.originalname}"`);
            res.send(outputBuf);
            console.log(`[REPAIR] Fichier réparé avec succès: ${req.file.originalname}`);
        } catch (readErr) {
            res.status(500).json({ message: "Erreur lors de la lecture du fichier réparé." });
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
