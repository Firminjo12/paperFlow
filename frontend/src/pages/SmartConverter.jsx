import React, { useState, useCallback, useRef } from 'react';
import { useFeedback } from '../contexts/FeedbackContext';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  Upload, 
  X, 
  ArrowRight, 
  Download, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileType
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { pdfjs as pdfjsLib } from 'react-pdf';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun
} from 'docx';
import { uploadToStorage } from '../utils/storage';

// La configuration du worker et du WASM est gérée globalement dans main.jsx

const SmartConverter = () => {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [targetFormat, setTargetFormat] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { triggerFeedback } = useFeedback();
  const { jwt, user } = useAuth();

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      
      // Détection automatique du type
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      const type = getFileType(extension);
      setFileType(type);
      
      // Suggestions de formats de sortie
      const suggestions = getTargetFormats(type);
      if (suggestions.length > 0) {
        setTargetFormat(suggestions[0]);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    }
  });

  const getFileType = (ext) => {
    if (ext === 'pdf') return 'PDF';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'IMAGE';
    if (['doc', 'docx'].includes(ext)) return 'WORD';
    return 'UNKNOWN';
  };

  const getTargetFormats = (type) => {
    switch (type) {
      case 'PDF': return ['JPG', 'PNG'];
      case 'IMAGE': return ['PDF', 'PNG', 'JPG'];
      case 'WORD': return ['PDF'];
      default: return [];
    }
  };

  const handleConvert = async () => {
    if (!file || !targetFormat) return;

    setIsConverting(true);
    setProgress(10);
    setError(null);

    try {
      if (fileType === 'IMAGE' && targetFormat === 'PDF') {
        await convertImageToPdf();
      } else if (fileType === 'PDF' && (targetFormat === 'JPG' || targetFormat === 'PNG')) {
        await convertPdfToImage();
      } else if (fileType === 'WORD' && targetFormat === 'PDF') {
        await convertWordToPdf();
      } else if (fileType === 'PDF' && targetFormat === 'WORD') {
        await convertPdfToWord();
      } else {
        throw new Error("Ce type de conversion n'est pas encore supporté localement.");
      }

      // Action succeeded, let's log it if logged in
      if (jwt) {
          // Wait a tiny bit to ensure result state is updated or just use locals
          const convType = `${fileType} to ${targetFormat}`;
          try {
              // 1. Upload the result blob to Storage
              const userId = user?.id || user?._id || 'anonymous';
              const downloadURL = await uploadToStorage(result.blob, userId, 'converted');

              // 2. Log to Backend
              await api.logDocument(jwt, {
                  file_name: file.name,
                  file_size: file.size,
                  action: 'convert',
                  convert_type: convType,
                  file_url: downloadURL
              });
          } catch (loggingErr) {
              console.error("Logging Error:", loggingErr);
          }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de la conversion.");
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  };

  const convertWordToPdf = async () => {
    setProgress(20);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Extraction du texte et des images simples du Word
      // Note: mammoth extrait le contenu HTML, nous allons extraire le texte brut pour la version simplifiée
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      setProgress(50);
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 11;
      const margin = 50;
      
      // Découpage du texte en lignes (approche simplifiée)
      const lines = text.split('\n');
      let currentY = height - margin;

      for (const line of lines) {
        if (currentY < margin + fontSize) {
          page = pdfDoc.addPage();
          currentY = height - margin;
        }
        if (line.trim()) {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
          });
        }
        currentY -= fontSize * 1.5;
      }

      setProgress(85);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setResult({
        url,
        blob,
        name: `${file.name.split('.')[0]}.pdf`,
        type: 'PDF'
      });
      setProgress(100);
    } catch (err) {
      throw new Error("Erreur lors de la conversion Word vers PDF : " + err.message);
    }
  };

  const convertPdfToWord = async () => {
    setProgress(20);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm/`
      }).promise;
      const numPages = pdf.numPages;
      const docSections = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(20 + (i / numPages) * 50);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Regrouper le texte par ligne (Y approximatif)
        const items = textContent.items.map(item => ({
          text: item.str,
          y: Math.round(item.transform[5]),
          x: Math.round(item.transform[4])
        }));

        if (items.length === 0) continue;

        // Tri par Y décroissant puis X croissant
        items.sort((a, b) => b.y - a.y || a.x - b.x);

        const paragraphs = [];
        let currentY = items[0].y;
        let currentLine = "";

        for (const item of items) {
          if (Math.abs(item.y - currentY) > 5) {
            paragraphs.push(new Paragraph({
              children: [new TextRun(currentLine.trim())],
              spacing: { after: 200 }
            }));
            currentLine = item.text;
            currentY = item.y;
          } else {
            currentLine += (currentLine ? " " : "") + item.text;
          }
        }
        // Ajouter la dernière ligne
        if (currentLine) {
          paragraphs.push(new Paragraph({
            children: [new TextRun(currentLine.trim())],
            spacing: { after: 200 }
          }));
        }

        docSections.push(...paragraphs);
      }

      setProgress(80);
      const doc = new Document({
        sections: [{
          properties: {},
          children: docSections,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);

      setResult({
        url,
        blob,
        name: `${file.name.split('.')[0]}.docx`,
        type: 'WORD'
      });
      setProgress(100);
    } catch (err) {
      console.error("Erreur conversion PDF->Word:", err);
      throw new Error("Erreur lors de la conversion PDF vers Word : " + err.message);
    }
  };

  const convertImageToPdf = async () => {
    setProgress(30);
    const pdfDoc = await PDFDocument.create();
    const imageBytes = await file.arrayBuffer();
    
    let image;
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error("Seuls les formats JPG et PNG sont supportés pour la conversion vers PDF.");
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    setProgress(80);
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    setResult({
      url,
      blob,
      name: `${file.name.split('.')[0]}.pdf`,
      type: 'PDF'
    });
    setProgress(100);
  };

  const convertPdfToImage = async () => {
    setProgress(10);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm/`
      }).promise;
      const numPages = pdf.numPages;
      const images = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round(10 + (i / numPages) * 80));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const format = targetFormat.toLowerCase() === 'jpg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(format, 0.9);
        
        images.push({
          url: dataUrl,
          name: `${file.name.split('.')[0]}_page_${i}.${targetFormat.toLowerCase()}`
        });
      }

      if (images.length === 1) {
        // Convert dataUrl to blob
        const res = await fetch(images[0].url);
        const blob = await res.blob();
        setResult({
          url: images[0].url,
          blob,
          name: images[0].name,
          type: targetFormat
        });
      } else {
        // Création d'un ZIP pour plusieurs pages
        setProgress(95);
        const zip = new JSZip();
        for (const img of images) {
          const base64Data = img.url.split(',')[1];
          zip.file(img.name, base64Data, { base64: true });
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        
        setResult({
          url: zipUrl,
          blob: zipBlob,
          name: `${file.name.split('.')[0]}_images.zip`,
          type: 'ZIP',
          count: images.length
        });
      }
      setProgress(100);
    } catch (err) {
      throw new Error("Erreur lors de la conversion PDF vers Image : " + err.message);
    }
  };

  const downloadResult = () => {
    if (!result) {
      console.error("Aucun résultat disponible pour le téléchargement.");
      return;
    }
    
    try {
      console.log("Démarrage du téléchargement manuel...");
      console.log("Nom du fichier :", result.name);
      console.log("Type :", result.type);
      
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.name;
      
      // Configuration pour forcer le téléchargement
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Style pour rendre le lien invisible mais fonctionnel
      link.style.display = 'none';
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      
      // Nettoyage avec un délai plus long
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        console.log("Lien de téléchargement nettoyé.");
        triggerFeedback();
      }, 1000);
      
    } catch (err) {
      console.error("Erreur critique lors de l'exécution du clic de téléchargement :", err);
      alert("Le téléchargement a échoué. Veuillez vérifier les permissions de votre navigateur.");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50 dark:bg-black/20">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5">
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Convertisseur <span className="text-blue-600">Intelligent</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Importez n'importe quel fichier, nous nous occupons du reste. Traitement 100% local.
            </p>
          </div>

          {!file ? (
            <div 
              {...getRootProps()} 
              className={`
                border-3 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 scale-[0.99]' : 'border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50'}
              `}
            >
              <input {...getInputProps()} />
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-600/20 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Glissez-déposez votre fichier ici
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                PDF, JPG, PNG, DOCX (Max 50 Mo)
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    {fileType === 'PDF' ? <FileText size={24} /> : fileType === 'IMAGE' ? <ImageIcon size={24} /> : <FileType size={24} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 uppercase font-black tracking-widest">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {fileType}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setResult(null); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {!result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                      Format de sortie souhaité
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {getTargetFormats(fileType).map((format) => (
                        <button
                          key={format}
                          onClick={() => setTargetFormat(format)}
                          className={`
                            px-6 py-3 rounded-xl font-bold transition-all border-2
                            ${targetFormat === format 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30 scale-105' 
                              : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-blue-400'}
                          `}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end">
                    <button
                      disabled={!targetFormat || isConverting}
                      onClick={handleConvert}
                      className={`
                        w-full md:w-auto px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3
                        ${!targetFormat || isConverting
                          ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                          : 'bg-red-600 text-white shadow-2xl shadow-red-500/40 hover:bg-red-700 hover:-translate-y-1 active:scale-95'}
                      `}
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Conversion en cours...
                        </>
                      ) : (
                        <>
                          Convertir <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600">
                  <AlertCircle size={20} />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}

              {result && (
                <div className="p-8 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                      <CheckCircle2 size={32} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xl font-black text-slate-900 dark:text-white">Fichier converti !</h4>
                      <p className="text-green-600/80 font-bold">
                        {result.name} {result.count && `(${result.count} pages)`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadResult}
                    className="w-full md:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                  >
                    <Download size={18} />
                    {result.type === 'ZIP' ? 'Télécharger Tout (ZIP)' : 'Télécharger'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 dark:bg-white/5 px-8 py-4 flex flex-wrap justify-center gap-8 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Traitement Local
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Confidentialité Garantie
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            Haute Qualité
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartConverter;
