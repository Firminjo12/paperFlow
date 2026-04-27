import React, { useState, useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureOverlay from './SignatureOverlay';
import TextOverlay from './TextOverlay';
import {
    ChevronLeft, ChevronRight, Download, Plus, Trash2,
    Type, ZoomIn, ZoomOut, Calendar, PenSquare, Image as ImageIcon,
    CheckCircle
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { uploadToStorage } from '../utils/storage';



const PdfEditor = forwardRef(({ file, signatureUrl, action = 'sign', onChangeSignature, onFinalize, onComplete }, ref) => {
    const { user, jwt } = useAuth();
    const [numPages, setNumPages] = useState(null);

    const [pageNumber, setPageNumber] = useState(1);
    const [signatures, setSignatures] = useState([]);
    const [textElements, setTextElements] = useState([]);
    const [imageElements, setImageElements] = useState([]);
    const [opacity, setOpacity] = useState(1.0);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedType, setSelectedType] = useState(null); // 'signature', 'text', 'image'
    const imageInputRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [scale, setScale] = useState(1.1);
    const containerRef = useRef(null);
    const pageRef = useRef(null);

    const [pdfCopy, setPdfCopy] = useState(null);

    const pdfOptions = useMemo(() => ({
        wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
        verbosity: 0 // Silencie les warnings non fatals comme OpenJPEG
    }), []);

    useEffect(() => {
        if (!file) return;
        file.arrayBuffer().then(buf => {
            setPdfCopy(buf.slice(0));
        });
    }, [file]);

    const [finalPdfUrl, setFinalPdfUrl] = useState(null);

    useImperativeHandle(ref, () => ({
        finalize: finalizePdf,
        isReady: signatures.length > 0 || textElements.length > 0 || imageElements.length > 0
    }));

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    const addSignature = () => {
        if (!signatureUrl) return;

        const img = new window.Image();
        img.onload = () => {
            const natWidth = img.width;
            const natHeight = img.height;

            let sigWidth = 150;
            // Respecter le ratio pour que l'image ne flotte pas asymétriquement
            let sigHeight = (natHeight && natWidth) ? (150 * (natHeight / natWidth)) : 75;
            let posX = 50;
            let posY = 50;

            if (pageRef.current) {
                const { offsetWidth } = pageRef.current;
                const responsiveWidth = offsetWidth < 500 ? 180 : 150;
                sigWidth = responsiveWidth;
                sigHeight = (natHeight && natWidth) ? (responsiveWidth * (natHeight / natWidth)) : (responsiveWidth * (75 / 150));
                
                const uiCenterX = (offsetWidth - (responsiveWidth * scale)) / 2;
                posX = uiCenterX / scale;
                posY = 50;
            }

            const newId = Date.now();
            const newSignature = {
                id: newId,
                url: signatureUrl,
                page: pageNumber,
                x: posX,
                y: posY,
                width: sigWidth,
                height: sigHeight,
                opacity: opacity,
                natWidth,
                natHeight
            };
            setSignatures(prev => [...prev, newSignature]);
            setSelectedId(newId);
            setSelectedType('signature');
        };
        img.src = signatureUrl;
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target.result;
            const img = new window.Image();
            img.onload = () => {
                addImageElement(imageUrl, img.width, img.height);
            };
            img.src = imageUrl;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const addImageElement = (imageUrl, natWidth, natHeight) => {
        let imgWidth = 150;
        let imgHeight = (natHeight && natWidth) ? (150 * (natHeight / natWidth)) : 150;
        let posX = 50;
        let posY = 70;

        if (pageRef.current) {
            const { offsetWidth } = pageRef.current;
            const uiCenterX = (offsetWidth - (imgWidth * scale)) / 2;
            posX = uiCenterX / scale;
            posY = 70;
        }

        const newId = Date.now();
        const newImage = {
            id: newId,
            url: imageUrl,
            page: pageNumber,
            x: posX,
            y: posY,
            width: imgWidth,
            height: imgHeight,
            opacity: 1.0,
            natWidth,
            natHeight
        };
        setImageElements(prev => [...prev, newImage]);
        setSelectedId(newId);
        setSelectedType('image');
    };

    const addText = (textValue = "Nouveau texte") => {
        const fontSizePoints = 16;
        let posX = 100;
        let posY = 100;

        if (pageRef.current) {
            const { offsetWidth } = pageRef.current;
            const uiCenterX = (offsetWidth - (100 * scale)) / 2;
            posX = uiCenterX / scale;
            posY = 100;
        }

        const newText = {
            id: Date.now(),
            text: textValue,
            page: pageNumber,
            x: posX,
            y: posY,
            fontSize: fontSizePoints,
            color: '#000000'
        };
        setTextElements([...textElements, newText]);
        setSelectedId(newText.id);
        setSelectedType('text');
    };

    const addDate = () => {
        const today = new Date().toLocaleDateString('fr-FR');
        addText(today);
    };

    const removeSignature = (id) => {
        setSignatures(signatures.filter(s => s.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const removeText = (id) => {
        setTextElements(textElements.filter(t => t.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const removeImage = (id) => {
        setImageElements(imageElements.filter(img => img.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const updateSignaturePosition = (id, pos) => {
        setSelectedId(id);
        setSelectedType('signature');
        setSignatures(signatures.map(s => s.id === id ? {
            ...s,
            x: pos.x / scale,
            y: pos.y / scale,
            width: pos.width / scale,
            height: pos.height / scale
        } : s));
    };

    const updateImagePosition = (id, pos) => {
        setSelectedId(id);
        setSelectedType('image');
        setImageElements(imageElements.map(img => img.id === id ? {
            ...img,
            x: pos.x / scale,
            y: pos.y / scale,
            width: pos.width / scale,
            height: pos.height / scale
        } : img));
    };

    const handleOpacityChange = (newVal) => {
        setOpacity(newVal);
        if (selectedId) {
            if (selectedType === 'signature') {
                setSignatures(signatures.map(s => s.id === selectedId ? { ...s, opacity: newVal } : s));
            } else if (selectedType === 'image') {
                setImageElements(imageElements.map(img => img.id === selectedId ? { ...img, opacity: newVal } : img));
            }
        }
    };

    const updateTextPosition = (id, data) => {
        setSelectedId(id);
        setSelectedType('text');
        setTextElements(textElements.map(t => t.id === id ? {
            ...t,
            ...data,
            x: data.x / scale,
            y: data.y / scale,
            fontSize: data.fontSize / scale
        } : t));
    };

    const clearAll = () => {
        if (window.confirm("Effacer tous les éléments ajoutés ?")) {
            setSignatures([]);
            setTextElements([]);
            setImageElements([]);
            setSelectedId(null);
        }
    };

    const finalizePdf = async () => {
        setIsProcessing(true);
        try {
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

            for (const sig of signatures) {
                const response = await fetch(sig.url);
                const signatureBytes = await response.arrayBuffer();
                let signatureImage;
                if (sig.url.includes('image/jpeg') || sig.url.includes('image/jpg')) {
                    signatureImage = await pdfDoc.embedJpg(signatureBytes);
                } else {
                    signatureImage = await pdfDoc.embedPng(signatureBytes);
                }
                const targetPage = pages[sig.page - 1];
                let { width: pdfWidth, height: pdfHeight } = targetPage.getSize();
                const rotation = targetPage.getRotation().angle;
                
                // Calcul précis de l'offset UI à annuler (p-1 et border-2 = 6px)
                // Cet offset doit être converti proportionnellement à ce qui est affiché.
                const uiOffset = 6; 
                const finalWidth = sig.width - (uiOffset * 2 / scale);
                const finalHeight = sig.height - (uiOffset * 2 / scale);
                const ptX = sig.x + (uiOffset / scale);
                const ptY = sig.y + (uiOffset / scale);

                let finalX = ptX;
                // Inversion de l'axe Y : Y part du bas en pdf-lib
                let finalY = pdfHeight - ptY - finalHeight;

                if (rotation === 90) {
                    finalX = ptY;
                    finalY = ptX;
                } else if (rotation === 180) {
                    finalX = pdfWidth - ptX - finalWidth;
                    finalY = ptY;
                } else if (rotation === 270) {
                    finalX = pdfHeight - ptY - finalHeight;
                    finalY = pdfWidth - ptX - finalWidth;
                }

                targetPage.drawImage(signatureImage, {
                    x: finalX,
                    y: finalY,
                    width: finalWidth,
                    height: finalHeight,
                    opacity: sig.opacity || 1,
                    rotate: degrees(-rotation)
                });
            }

            for (const img of imageElements) {
                const imageBytes = await fetch(img.url).then(res => res.arrayBuffer());
                let pdfImage;
                try {
                    if (img.url.includes('image/jpeg') || img.url.includes('image/jpg')) {
                        pdfImage = await pdfDoc.embedJpg(imageBytes);
                    } else {
                        pdfImage = await pdfDoc.embedPng(imageBytes);
                    }
                } catch (e) {
                    pdfImage = await pdfDoc.embedPng(imageBytes).catch(() => pdfDoc.embedJpg(imageBytes));
                }
                const targetPage = pages[img.page - 1];
                let { width: pdfWidth, height: pdfHeight } = targetPage.getSize();
                const rotation = targetPage.getRotation().angle;
                
                // Calcul précis de l'offset UI (p-1 + border-2 = 6px)
                const uiOffset = 6;
                const finalWidth = img.width - (uiOffset * 2 / scale);
                const finalHeight = img.height - (uiOffset * 2 / scale);
                const ptX = img.x + (uiOffset / scale);
                const ptY = img.y + (uiOffset / scale);

                let finalX = ptX;
                // Inversion de l'axe Y : Y part du bas dans pdf-lib
                let finalY = pdfHeight - ptY - finalHeight;

                if (rotation === 90) {
                    finalX = ptY;
                    finalY = ptX;
                } else if (rotation === 180) {
                    finalX = pdfWidth - ptX - finalWidth;
                    finalY = ptY;
                } else if (rotation === 270) {
                    finalX = pdfHeight - ptY - finalHeight;
                    finalY = pdfWidth - ptX - finalWidth;
                }

                targetPage.drawImage(pdfImage, {
                    x: finalX,
                    y: finalY,
                    width: finalWidth,
                    height: finalHeight,
                    opacity: img.opacity || 1,
                    rotate: degrees(-rotation)
                });
            }

            for (const textItem of textElements) {
                const targetPage = pages[textItem.page - 1];
                const { width: pdfWidth, height: pdfHeight } = targetPage.getSize();
                const rotation = targetPage.getRotation().angle;
                
                // Accounting for UI frame offsets: px-3 (12px), py-1.5 (6px), border-2 (2px)
                const offsetX = 14; 
                const offsetY = 8;
                
                // Effective point coordinates in top-down system
                const ptX = textItem.x + (offsetX / scale);
                const ptY = textItem.y + (offsetY / scale);
                const ptSize = textItem.fontSize;

                // Adjust for rotation and bottom-up PDF system
                let finalX = ptX;
                let finalY = pdfHeight - ptY - (ptSize * 0.8);

                if (rotation === 90) {
                    finalX = ptY;
                    finalY = ptX;
                } else if (rotation === 180) {
                    finalX = pdfWidth - ptX;
                    finalY = ptY;
                } else if (rotation === 270) {
                    finalX = pdfHeight - ptY;
                    finalY = pdfWidth - ptX;
                }

                targetPage.drawText(textItem.text || "", {
                    x: finalX,
                    y: finalY,
                    size: ptSize,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                    rotate: degrees(-rotation)
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setFinalPdfUrl(url);

            // If user is logged in, save document metadata to Backend
            if (user && jwt) {
                try {
                    // 1. Upload to Firebase Storage first
                    const finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                    // Give it a proper name for storage
                    const storageFile = new File([finalBlob], `signe_${file.name}`, { type: 'application/pdf' });
                    const downloadURL = await uploadToStorage(storageFile, user.id || user._id, 'signed');

                    // 2. Log to Backend with the URL (sera null si l'upload a échoué mais on log quand même)
                    await api.logDocument(jwt, {
                        file_name: file.name,
                        file_size: file.size,
                        action: action,
                        pages_count: numPages || 1,
                        file_url: downloadURL
                    });

                    // Optionally save the signature if it's new
                    if (signatureUrl && signatures.length > 0) {
                        try {
                            const existingSigs = await api.getSignatures(jwt);
                            if (!existingSigs || existingSigs.length === 0) {
                                await api.saveSignature(jwt, {
                                    signature_data: signatureUrl
                                });
                            }
                        } catch (e) {
                             console.warn("Saving signature failed:", e);
                        }
                    }
                } catch (dbError) {
                    console.error("Error saving to backend:", dbError);
                    // Tentative de log minimal si storage ou le premier log a échoué
                    try {
                        await api.logDocument(jwt, {
                            file_name: file.name,
                            file_size: file.size,
                            action: action,
                            pages_count: numPages || 1,
                            file_url: null
                        });
                    } catch (e) {}
                }
            }

            const fileName = `signe_${file.name ? file.name.replace(/\.[^/.]+$/, "") : "document"}.pdf`;

            // Cleanup and move to next step
            setTimeout(() => {
                setIsProcessing(false);
                if (onComplete) onComplete(url, fileName);
                if (onFinalize) onFinalize(url, fileName);
            }, 1000);


        } catch (error) {
            console.error('PdfEditor Error:', error);
            alert(`Erreur: ${error.message}`);
            setIsProcessing(false);
        }
    };

    const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.5));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-8">
                <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center space-y-6 text-center">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2 shadow-inner">
                        <CheckCircle size={48} />
                    </div>
                    <div className="space-y-4 w-full">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">C'est signé !</h2>
                        <div className="h-px bg-slate-100 w-full my-6"></div>
                        <p className="text-xl font-bold text-slate-800">Voulez-vous signer un autre document ?</p>
                    </div>
                    <div className="w-full pt-4">
                        <button
                            onClick={() => {
                                if (finalPdfUrl) URL.revokeObjectURL(finalPdfUrl);
                                if (onFinalize) onFinalize();
                            }}
                            className="w-full py-4 px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-lg"
                        >
                            <Plus size={24} />
                            Oui, signer un autre
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-300 p-2 md:p-4 flex flex-col lg:flex-row items-center justify-between shadow-sm z-30 gap-3 md:gap-4 shrink-0">
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full lg:w-auto">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 shrink-0">
                        <button
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(pageNumber - 1)}
                            className="p-1.5 md:p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-2 md:px-3 text-[12px] md:text-sm font-bold text-slate-700 min-w-[60px] md:min-w-[100px] text-center">
                            {pageNumber} / {numPages || '-'}
                        </span>
                        <button
                            disabled={pageNumber >= numPages}
                            onClick={() => setPageNumber(pageNumber + 1)}
                            className="p-1.5 md:p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 gap-1 shrink-0">
                        <button onClick={zoomOut} className="p-2 hover:bg-white rounded-lg transition-all"><ZoomOut size={18} /></button>
                        <span className="px-2 text-xs font-black text-slate-500 w-10 text-center uppercase">{Math.round(scale * 100)}%</span>
                        <button onClick={zoomIn} className="p-2 hover:bg-white rounded-lg transition-all"><ZoomIn size={18} /></button>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />
                    <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
                        <button onClick={addSignature} disabled={!signatureUrl} className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-[12px] md:text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 shrink-0">
                            <Plus size={16} /> <span className="hidden xs:inline">Signature</span>
                        </button>
                        <button onClick={() => addText()} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] md:text-sm font-bold rounded-xl hover:bg-slate-50 shrink-0">
                            <Type size={16} /> <span className="hidden xs:inline">Texte</span>
                        </button>
                        <button onClick={addDate} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] md:text-sm font-bold rounded-xl hover:bg-slate-50 shrink-0">
                            <Calendar size={16} /> <span className="hidden xs:inline">Date</span>
                        </button>
                        <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] md:text-sm font-bold rounded-xl hover:bg-slate-50 shrink-0">
                            <ImageIcon size={16} /> <span className="hidden xs:inline">Image</span>
                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
                        <button onClick={clearAll} className="p-2 md:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Tout effacer">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="hidden lg:flex flex-col items-center gap-1 min-w-[120px] px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opacité</span>
                        <div className="flex items-center gap-3 w-full">
                            <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => handleOpacityChange(parseFloat(e.target.value))} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            <span className="text-[10px] md:text-xs font-bold text-slate-600 min-w-[30px] text-right">{Math.round(opacity * 100)}%</span>
                        </div>
                    </div>
                    <button onClick={finalizePdf} disabled={(signatures.length === 0 && textElements.length === 0 && imageElements.length === 0) || isProcessing} className="flex items-center justify-center gap-2 px-6 py-3 md:py-3.5 w-full lg:w-auto bg-blue-600 text-white text-[13px] md:text-sm font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 shrink-0 lg:mt-0 transition-all active:scale-95">
                        <div className="relative w-5 h-5 flex items-center justify-center">
                            {isProcessing ? <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                        </div>
                        <span>{isProcessing ? 'Traitement...' : action === 'sign' ? 'Finaliser PDF' : 'Enregistrer PDF'}</span>
                    </button>
                </div>
            </div>

            <Document
                file={pdfCopy}
                options={pdfOptions}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="flex-1 flex flex-col items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" /><p className="font-bold text-slate-400">Ouverture du document...</p></div>}
                error={<div className="flex-1 flex flex-col items-center justify-center bg-white p-8"><p className="text-red-500 font-bold mb-4">Impossible de lire ce PDF.</p><button onClick={onFinalize} className="px-6 py-2 bg-slate-100 rounded-xl font-bold">Retour</button></div>}
            >
                <div className="flex flex-1 overflow-hidden relative" style={{ height: 'calc(100vh - 160px)' }}>
                    <div className="w-48 bg-slate-100/90 border-r border-slate-300 overflow-y-auto hidden md:block z-10 shrink-0 relative custom-scrollbar">
                        {numPages && <div className="p-4 pb-2 text-xs font-black text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-100/90 backdrop-blur z-20 shadow-sm flex items-center justify-between"><span>Pages</span><span className="bg-slate-200 px-2 py-0.5 rounded-full text-[10px] text-slate-600">{numPages}</span></div>}
                        <div className="py-2">
                            {numPages && Array.from(new Array(numPages), (el, index) => (
                                <div key={`thumb-${index + 1}`} className={`p-4 cursor-pointer transition-colors flex justify-center relative ${pageNumber === index + 1 ? 'bg-blue-100/50 border-l-4 border-blue-600' : 'hover:bg-slate-200/50 border-l-4 border-transparent'}`} onClick={() => setPageNumber(index + 1)}>
                                    <div className={`shadow-md bg-white relative transition-all ${pageNumber === index + 1 ? 'scale-105 ring-2 ring-blue-500' : 'hover:scale-105'}`}>
                                        <Page pageNumber={index + 1} width={110} renderTextLayer={false} renderAnnotationLayer={false} />
                                        <div className="absolute -bottom-2 -right-2 text-[10px] font-black w-6 h-6 flex items-center justify-center text-slate-600 bg-white rounded-full shadow border border-slate-100">{index + 1}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-12 flex justify-center bg-slate-200" ref={containerRef}>
                        <div className="relative mb-12 shadow-2xl bg-white" style={{ width: 'fit-content', height: 'fit-content' }}>
                            <div className="relative" ref={pageRef}>
                                <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
                                {signatures.filter(s => s.page === pageNumber).map(sig => (
                                    <SignatureOverlay key={sig.id} imageUrl={sig.url} width={sig.width * scale} height={sig.height * scale} position={{ x: sig.x * scale, y: sig.y * scale }} opacity={sig.opacity} isSignature={true} isSelected={selectedId === sig.id} onUpdate={(pos) => updateSignaturePosition(sig.id, pos)} onRemove={() => removeSignature(sig.id)} onSelect={() => { setSelectedId(sig.id); setSelectedType('signature'); setOpacity(sig.opacity || 1.0); }} />
                                ))}
                                {imageElements.filter(img => img.page === pageNumber).map(img => (
                                    <SignatureOverlay key={img.id} imageUrl={img.url} width={img.width * scale} height={img.height * scale} position={{ x: img.x * scale, y: img.y * scale }} opacity={img.opacity} isSignature={false} isSelected={selectedId === img.id} onUpdate={(pos) => updateImagePosition(img.id, pos)} onRemove={() => removeImage(img.id)} onSelect={() => { setSelectedId(img.id); setSelectedType('image'); setOpacity(img.opacity || 1.0); }} />
                                ))}
                                {textElements.filter(t => t.page === pageNumber).map(text => (
                                    <TextOverlay key={text.id} initialText={text.text} fontSize={text.fontSize * scale} position={{ x: text.x * scale, y: text.y * scale }} onUpdate={(data) => updateTextPosition(text.id, data)} onRemove={() => removeText(text.id)} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Document>

            <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2 text-blue-400"><CheckCircle size={12} /> Mode Edition</span>
                <span className="text-slate-500">|</span>
                <span className="flex items-center gap-2">Double-clic sur le texte pour modifier</span>
                <span className="text-slate-500">|</span>
                <span className="flex items-center gap-2">Utilisez + et - pour la taille du texte</span>
            </div>
        </div>
    );
});

export default PdfEditor;
