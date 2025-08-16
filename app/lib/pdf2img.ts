export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

// Temporary bypass function for testing AI analysis
export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    console.log('Bypassing PDF to image conversion for testing...');
    
    // Create a placeholder image file for now
    // This allows us to test the AI analysis without PDF conversion
    try {
        // Create a simple placeholder blob
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        canvas.width = 800;
        canvas.height = 1000;
        
        if (context) {
            // Draw a simple placeholder
            context.fillStyle = "#f0f0f0";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = "#666";
            context.font = "24px Arial";
            context.textAlign = "center";
            context.fillText("PDF Preview", canvas.width / 2, canvas.height / 2);
            context.fillText("(Conversion Bypassed)", canvas.width / 2, canvas.height / 2 + 40);
        }
        
        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
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
                1.0
            );
        });
    } catch (err) {
        console.error("Placeholder creation error:", err);
        return {
            imageUrl: "",
            file: null,
            error: `Failed to create placeholder: ${err}`,
        };
    }
}
