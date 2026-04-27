const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/authMiddleware');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const upload = multer({ dest: os.tmpdir() });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Fonction pour extraire le texte via LibreOffice
const extractTextWithLibreOffice = (pdfPath) => {
    return new Promise((resolve, reject) => {
        const outDir = os.tmpdir();
        // On essaye sans spécifier :Text si ça échoue, ou avec
        const cmd = `soffice --headless --convert-to txt --outdir "${outDir}" "${pdfPath}"`;
        
        console.log("[DEBUG-AI] Commande lancée:", cmd);
        
        exec(cmd, (error, stdout, stderr) => {
            console.log("[DEBUG-AI] Stdout:", stdout);
            console.log("[DEBUG-AI] Stderr:", stderr);

            if (error) {
                console.error("[DEBUG-AI] Erreur Exec:", error);
                return reject(error);
            }
            
            const fileName = path.basename(pdfPath, path.extname(pdfPath)) + ".txt";
            const txtPath = path.join(outDir, fileName);
            
            console.log("[DEBUG-AI] Recherche du fichier:", txtPath);

            if (fs.existsSync(txtPath)) {
                const text = fs.readFileSync(txtPath, 'utf8');
                try { fs.unlinkSync(txtPath); } catch (e) {}
                resolve(text);
            } else {
                reject(new Error("Le fichier .txt n'a pas été créé."));
            }
        });
    });
};

router.post('/summarize', auth, upload.single('file'), async (req, res) => {
    let tempPdfPath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier fourni." });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: "Clé API Gemini manquante." });
        }

        // ÉTAPE CRITIQUE : Renommer le fichier pour ajouter l'extension .pdf
        // Sinon LibreOffice échoue (Erreur 0xc10)
        tempPdfPath = req.file.path + ".pdf";
        fs.renameSync(req.file.path, tempPdfPath);

        console.log("[DEBUG-AI] Extraction du texte via LibreOffice...");
        
        let text = "";
        try {
            text = await extractTextWithLibreOffice(tempPdfPath);
        } catch (err) {
            console.error("[DEBUG-AI] Échec LibreOffice:", err.message);
            return res.status(500).json({ message: "LibreOffice n'a pas pu extraire le texte du PDF." });
        }

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: "Le document ne contient pas de texte extractible." });
        }

        console.log(`[DEBUG-AI] Texte extrait (${text.length} chars). Envoi à Gemini...`);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Voici le contenu d'un document PDF. Peux-tu en faire un résumé clair, structuré et professionnel en français ? Utilise des puces si nécessaire.\n\nContenu :\n${text.substring(0, 30000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        res.json({ summary });

    } catch (error) {
        console.error("[AI-SUMMARY] Erreur:", error);
        res.status(500).json({ message: "Erreur lors du résumé par l'IA.", shadow: error.message });
    } finally {
        // Nettoyage de tous les fichiers temporaires
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        if (tempPdfPath && fs.existsSync(tempPdfPath)) {
            try { fs.unlinkSync(tempPdfPath); } catch (e) {}
        }
    }
});

module.exports = router;
