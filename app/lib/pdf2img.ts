export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;
    
    isLoading = true;
    
    try {
        // Try to load PDF.js
        const lib = await import("pdfjs-dist");
        
        // Set worker source to match your PDF.js version
        lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.js`;
        
        pdfjsLib = lib;
        isLoading = false;
        console.log('PDF.js loaded successfully with version:', lib.version);
        return lib;
    } catch (error) {
        console.error('Failed to load PDF.js:', error);
        isLoading = false;
        throw error;
    }
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    console.log('Starting PDF conversion for:', file.name);
    
    try {
        const lib = await loadPdfJs();
        console.log('PDF.js library loaded');
        
        const arrayBuffer = await file.arrayBuffer();
        console.log('File converted to array buffer');
        
        const pdf = await lib.getDocument({ 
            data: arrayBuffer,
            // Add these options to help with loading
            cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
            cMapPacked: true
        }).promise;
        console.log('PDF document loaded, pages:', pdf.numPages);
        
        const page = await pdf.getPage(1);
        console.log('First page loaded');
        
        const viewport = page.getViewport({ scale: 2 }); // Reduced scale for better performance
        console.log('Viewport created:', viewport.width, 'x', viewport.height);
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (!context) {
            throw new Error('Could not get 2D context from canvas');
        }
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        
        console.log('Starting page render...');
        await page.render({ canvasContext: context, viewport }).promise;
        console.log('Page rendered successfully');
        
        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        console.log('Blob created successfully, size:', blob.size);
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });
                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        console.error('Failed to create blob from canvas');
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                0.95 // Slightly lower quality for better performance
            );
        });
    } catch (err) {
        console.error("PDF conversion error:", err);
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
