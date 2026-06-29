const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/authMiddleware');
const os = require('os');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: os.tmpdir() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Extraction ultra-robuste
const extractTextNative = async (buffer) => {
    try {
        const pdf = require('pdf-parse');
        let data;
        
        // Détection dynamique du mode de fonctionnement (Fonction ou Classe)
        if (typeof pdf === 'function') {
            data = await pdf(buffer);
        } else {
            const Parser = pdf.PDFParse || (pdf.default && pdf.default.PDFParse);
            if (Parser) {
                const instance = new Parser();
                data = await instance.parse(buffer);
            }
        }
        
        return data?.text || (typeof data === 'string' ? data : "");
    } catch (err) {
        console.error("[AI-EXTRACT] Erreur locale:", err.message);
        return "";
    }
};

router.post('/extract-text', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Fichier manquant" });

        console.log(`[AI] Analyse de: ${req.file.originalname}`);
        const buffer = fs.readFileSync(req.file.path);
        
        let text = await extractTextNative(buffer);

        // Si le texte est extrait, c'est gagné !
        if (text && text.trim().length > 0) {
            return res.json({ text });
        }

        // Si vraiment vide, on tente une dernière fois avec Gemini mais avec un prompt textuel simple
        console.log("[AI] Texte vide, essai Gemini simple...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
            { inlineData: { data: buffer.toString("base64"), mimeType: "application/pdf" } },
            "Donne moi juste le texte de ce document."
        ]);
        text = (await result.response).text();

        res.json({ text: text || "Contenu illisible" });
    } catch (error) {
        console.error("[AI] Erreur:", error.message);
        res.status(500).json({ message: "Erreur d'analyse." });
    } finally {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
});

router.post('/chat', auth, async (req, res) => {
    try {
        const { text, userMessage } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Analyses ce document:\n${text}\n\nQuestion: ${userMessage}`;
        const result = await model.generateContent(prompt);
        res.json({ reply: (await result.response).text() });
    } catch (error) {
        res.status(500).json({ message: "Erreur IA." });
    }
});

router.post('/summarize', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Fichier manquant" });
        const buffer = fs.readFileSync(req.file.path);
        const text = await extractTextNative(buffer);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Fais un résumé de ce texte en français : " + text);
        res.json({ summary: (await result.response).text() });
    } catch (err) {
        res.status(500).json({ message: "Erreur résumé" });
    } finally {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
});

module.exports = router;
