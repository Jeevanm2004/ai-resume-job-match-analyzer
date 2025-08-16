export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

// Type definitions for PDF.js
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

// PDF.js loading state
let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

/**
 * Dynamically load PDF.js library
 */
async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) {
        return pdfjsLib;
    }

    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;
    
    loadPromise = new Promise((resolve, reject) => {
        // Check if already loaded globally
        if (window.pdfjsLib) {
            pdfjsLib = window.pdfjsLib;
            isLoading = false;
            resolve(pdfjsLib);
            return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        script.onload = () => {
            if (window.pdfjsLib) {
                pdfjsLib = window.pdfjsLib;
                
                // Configure worker
                pdfjsLib.GlobalWorkerOptions.workerSrc = 
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                console.log('PDF.js loaded successfully');
                isLoading = false;
                resolve(pdfjsLib);
            } else {
                const error = new Error('PDF.js failed to initialize');
                console.error(error);
                isLoading = false;
                reject(error);
            }
        };

        script.onerror = () => {
            const error = new Error('Failed to load PDF.js library');
            console.error(error);
            isLoading = false;
            reject(error);
        };

        document.head.appendChild(script);
    });

    return loadPromise;
}

/**
 * Convert data URL to Blob
 */
function dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
}

/**
 * Create a fallback placeholder image
 */
function createPlaceholderImage(file: File): Promise<PdfConversionResult> {
    console.log('Creating placeholder image for:', file.name);
    
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        canvas.width = 800;
        canvas.height = 1000;
        
        if (context) {
            // Draw placeholder background
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add border
            context.strokeStyle = "#cccccc";
            context.lineWidth = 2;
            context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Add text
            context.fillStyle = "#666666";
            context.font = "bold 28px Arial";
            context.textAlign = "center";
            context.fillText("PDF Document", canvas.width / 2, canvas.height / 2 - 60);
            
            context.font = "20px Arial";
            context.fillText(file.name, canvas.width / 2, canvas.height / 2 - 20);
            
            context.font = "16px Arial";
            context.fillStyle = "#999999";
            context.fillText("(Preview not available)", canvas.width / 2, canvas.height / 2 + 20);
            
            context.fillText(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`, canvas.width / 2, canvas.height / 2 + 50);
        }
        
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const originalName = file.name.replace(/\.pdf$/i, "");
                    const imageFile = new File([blob], `${originalName}_preview.png`, {
                        type: "image/png",
                    });
                    resolve({
                        imageUrl: URL.createObjectURL(blob),
                        file: imageFile,
                    });
                } else {
                    resolve({
                        imageUrl: "",
                        file: null,
                        error: "Failed to create placeholder image",
                    });
                }
            },
            "image/png",
            0.95
        );
    });
}

/**
 * Main PDF to Image conversion function
 */
export async function convertPdfToImage(
    file: File,
    options: {
        scale?: number;
        pageNumber?: number;
        quality?: number;
        fallbackToPlaceholder?: boolean;
    } = {}
): Promise<PdfConversionResult> {
    const {
        scale = 2.0,
        pageNumber = 1,
        quality = 0.95,
        fallbackToPlaceholder = true
    } = options;

    console.log('Starting PDF to image conversion for:', file.name);

    // Validate input
    if (!file || file.type !== 'application/pdf') {
        return {
            imageUrl: "",
            file: null,
            error: "Invalid file type. Expected PDF.",
        };
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return {
            imageUrl: "",
            file: null,
            error: "File too large. Maximum size is 50MB.",
        };
    }

    try {
        // Try to load PDF.js
        console.log('Loading PDF.js library...');
        const pdfLib = await loadPdfJs();
        
        if (!pdfLib) {
            throw new Error('PDF.js library not available');
        }

        // Read file as ArrayBuffer
        console.log('Reading file as ArrayBuffer...');
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result instanceof ArrayBuffer) {
                    resolve(e.target.result);
                } else {
                    reject(new Error('Failed to read file as ArrayBuffer'));
                }
            };
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsArrayBuffer(file);
        });

        console.log(`ArrayBuffer created, size: ${arrayBuffer.byteLength} bytes`);

        // Load PDF document
        console.log('Loading PDF document...');
        const loadingTask = pdfLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
            // Additional options for better compatibility
            verbosity: 0, // Reduce console output
            isEvalSupported: false,
            useWorkerFetch: false,
        });

        const pdf = await loadingTask.promise;
        console.log(`PDF loaded successfully, ${pdf.numPages} pages`);

        // Validate page number
        const targetPage = Math.min(Math.max(1, pageNumber), pdf.numPages);
        
        // Get the specified page
        console.log(`Loading page ${targetPage}...`);
        const page = await pdf.getPage(targetPage);

        // Set up viewport and canvas
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Failed to get 2D rendering context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        console.log(`Canvas created: ${canvas.width}x${canvas.height}`);

        // Render page to canvas
        console.log('Rendering page...');
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
            // Optional: Add background color
            background: 'white'
        };

        await page.render(renderContext).promise;
        console.log('Page rendered successfully');

        // Convert canvas to image
        const imageDataUrl = canvas.toDataURL('image/png', quality);
        const blob = dataURLToBlob(imageDataUrl);
        
        // Create file
        const originalName = file.name.replace(/\.pdf$/i, "");
        const imageFile = new File([blob], `${originalName}_page${targetPage}.png`, {
            type: "image/png",
            lastModified: Date.now()
        });

        console.log(`Conversion completed successfully, image size: ${blob.size} bytes`);

        return {
            imageUrl: imageDataUrl,
            file: imageFile,
        };

    } catch (error) {
        console.error('PDF conversion error:', error);
        
        // If fallback is enabled, create placeholder
        if (fallbackToPlaceholder) {
            console.log('Falling back to placeholder image...');
            const placeholderResult = await createPlaceholderImage(file);
            return {
                ...placeholderResult,
                error: `PDF conversion failed: ${error instanceof Error ? error.message : String(error)}. Showing placeholder.`
            };
        }

        return {
            imageUrl: "",
            file: null,
            error: `PDF conversion failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Batch convert multiple pages from a PDF
 */
export async function convertPdfToImages(
    file: File,
    options: {
        scale?: number;
        maxPages?: number;
        quality?: number;
    } = {}
): Promise<PdfConversionResult[]> {
    const {
        scale = 1.5,
        maxPages = 5,
        quality = 0.9
    } = options;

    const results: PdfConversionResult[] = [];
    
    try {
        const pdfLib = await loadPdfJs();
        if (!pdfLib) {
            throw new Error('PDF.js library not available');
        }

        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result instanceof ArrayBuffer) {
                    resolve(e.target.result);
                } else {
                    reject(new Error('Failed to read file'));
                }
            };
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsArrayBuffer(file);
        });

        const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = Math.min(pdf.numPages, maxPages);

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            try {
                const result = await convertPdfToImage(file, {
                    scale,
                    pageNumber: pageNum,
                    quality,
                    fallbackToPlaceholder: false
                });
                results.push(result);
            } catch (error) {
                results.push({
                    imageUrl: "",
                    file: null,
                    error: `Failed to convert page ${pageNum}: ${error}`
                });
            }
        }
    } catch (error) {
        results.push({
            imageUrl: "",
            file: null,
            error: `Failed to process PDF: ${error}`
        });
    }

    return results;
}

// Helper function to check if PDF.js is available
export function isPdfJsAvailable(): boolean {
    return pdfjsLib !== null || window.pdfjsLib !== undefined;
}

// Helper function to preload PDF.js
export async function preloadPdfJs(): Promise<boolean> {
    try {
        await loadPdfJs();
        return true;
    } catch (error) {
        console.error('Failed to preload PDF.js:', error);
        return false;
    }
}
