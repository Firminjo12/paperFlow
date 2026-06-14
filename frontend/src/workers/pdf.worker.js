import { PDFDocument } from 'pdf-lib';

// Ce code s'exécute dans un thread séparé (Web Worker)
// Il ne peut pas accéder au DOM, mais il a toute la puissance de calcul
self.onmessage = async (e) => {
    const { action, filesData } = e.data;

    if (action === 'merge') {
        try {
            const mergedPdf = await PDFDocument.create();
            
            for (let i = 0; i < filesData.length; i++) {
                // Envoyer la progression au thread principal
                self.postMessage({ 
                    status: 'progress', 
                    progress: Math.round(((i) / filesData.length) * 100) 
                });

                const pdfBytes = filesData[i];
                const pdf = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            self.postMessage({ status: 'progress', progress: 95 });
            
            const mergedPdfBytes = await mergedPdf.save();
            
            // Envoyer le résultat final au thread principal
            // On utilise un 'Transferable Object' (ArrayBuffer) pour plus de performance
            self.postMessage({ 
                status: 'success', 
                mergedPdfBytes 
            }, [mergedPdfBytes.buffer]);

        } catch (error) {
            self.postMessage({ status: 'error', error: error.message });
        }
    }
};
