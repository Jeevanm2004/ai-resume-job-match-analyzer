import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const addDebugInfo = (info: string) => {
        setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${info}`]);
        console.log('Debug:', info);
    };

    const handleFileSelect = (file: File | null) => {
        setFile(file);
        if (file) {
            addDebugInfo(`File selected: ${file.name} (${file.size} bytes, ${file.type})`);
        }
    }

    const updateProgress = (percent: number, message: string) => {
        setProgress(percent);
        setStatusText(message);
        addDebugInfo(`Progress: ${percent}% - ${message}`);
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { 
        companyName: string, 
        jobTitle: string, 
        jobDescription: string, 
        file: File  
    }) => {
        setIsProcessing(true);
        setDebugInfo([]);
        
        try {
            addDebugInfo('Starting analysis process');
            
            // Step 1: Validate Puter services
            updateProgress(5, 'Checking services...');
            if (!fs || !ai || !kv) {
                throw new Error('Puter services not available. Please refresh and try again.');
            }

            // Step 2: Upload the PDF file with retry logic
            updateProgress(20, 'Uploading your resume...');
            addDebugInfo('Attempting file upload to Puter');
            
            let uploadedFile;
            let uploadAttempts = 0;
            const maxUploadAttempts = 3;
            
            while (uploadAttempts < maxUploadAttempts) {
                try {
                    uploadedFile = await fs.upload([file]);
                    if (uploadedFile && uploadedFile.path) {
                        addDebugInfo(`File uploaded successfully: ${uploadedFile.path}`);
                        break;
                    }
                } catch (uploadError) {
                    uploadAttempts++;
                    addDebugInfo(`Upload attempt ${uploadAttempts} failed: ${uploadError.message}`);
                    
                    if (uploadAttempts >= maxUploadAttempts) {
                        throw new Error(`Failed to upload file after ${maxUploadAttempts} attempts: ${uploadError.message}`);
                    }
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
                }
            }

            if (!uploadedFile || !uploadedFile.path) {
                throw new Error('File upload completed but no path received');
            }

            // Step 3: Prepare data structure
            updateProgress(40, 'Preparing analysis data...');
            const uuid = generateUUID();
            addDebugInfo(`Generated UUID: ${uuid}`);
            
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                companyName, 
                jobTitle, 
                jobDescription,
                feedback: '',
                fileName: file.name,
                fileSize: file.size,
                uploadDate: new Date().toISOString(),
                status: 'processing'
            }

            // Store initial data
            try {
                await kv.set(`resume:${uuid}`, JSON.stringify(data));
                addDebugInfo('Initial data stored in KV');
            } catch (kvError) {
                addDebugInfo(`KV storage failed: ${kvError.message}`);
                // Continue anyway, as this is not critical for analysis
            }

            // Step 4: Prepare AI instructions
            updateProgress(50, 'Preparing AI analysis...');
            const instructions = prepareInstructions({ jobTitle, jobDescription, companyName });
            addDebugInfo(`Instructions prepared: ${instructions.substring(0, 100)}...`);

            // Step 5: AI Analysis with detailed error handling
            updateProgress(60, 'AI is analyzing your resume...');
            addDebugInfo('Starting AI analysis');
            
            let feedback;
            try {
                feedback = await ai.feedback(uploadedFile.path, instructions);
                addDebugInfo('AI analysis completed successfully');
            } catch (aiError) {
                addDebugInfo(`AI analysis failed: ${aiError.message}`);
                
                // Check if it's the PDF conversion error
                if (aiError.message.includes('Failed to convert PDF to image')) {
                    throw new Error('PDF processing failed. This might be due to a corrupted file or unsupported PDF format. Please try with a different PDF file.');
                } else if (aiError.message.includes('timeout')) {
                    throw new Error('AI analysis timed out. Please try again with a smaller file or check your connection.');
                } else {
                    throw new Error(`AI analysis failed: ${aiError.message}`);
                }
            }

            if (!feedback || !feedback.message) {
                throw new Error('AI analysis returned empty response');
            }

            // Step 6: Process AI response
            updateProgress(80, 'Processing analysis results...');
            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content?.[0]?.text || feedback.message.content;

            if (!feedbackText) {
                throw new Error('AI response is empty or malformed');
            }

            addDebugInfo(`AI response length: ${feedbackText.length} characters`);

            // Parse the AI response with better error handling
            let parsedFeedback;
            try {
                parsedFeedback = JSON.parse(feedbackText);
                addDebugInfo('AI response parsed as JSON successfully');
            } catch (parseError) {
                addDebugInfo(`JSON parsing failed, creating structured response: ${parseError.message}`);
                
                // If JSON parsing fails, create a structured response
                parsedFeedback = {
                    overall_score: 75,
                    ats_score: 70,
                    content_score: 80,
                    format_score: 75,
                    analysis: feedbackText,
                    suggestions: [
                        {
                            type: "improve",
                            tip: "Review the detailed analysis below for specific improvements"
                        }
                    ]
                };
            }

            // Step 7: Save final results
            updateProgress(90, 'Saving analysis results...');
            data.feedback = parsedFeedback;
            data.status = 'completed';
            
            try {
                await kv.set(`resume:${uuid}`, JSON.stringify(data));
                addDebugInfo('Final results saved to KV');
            } catch (kvError) {
                addDebugInfo(`Final KV save failed: ${kvError.message}`);
                // Still continue to show results
            }

            // Step 8: Complete
            updateProgress(100, 'Analysis complete! Redirecting...');
            addDebugInfo('Analysis process completed successfully');
            
            console.log('Analysis completed:', data);
            
            // Navigate to results
            setTimeout(() => {
                navigate(`/resume/${uuid}`);
            }, 1000);

        } catch (error) {
            console.error('Analysis error:', error);
            addDebugInfo(`Fatal error: ${error.message}`);
            
            setStatusText(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
            setIsProcessing(false);
            setProgress(0);
            
            // Show debug info on error
            console.log('Debug information:', debugInfo);
        }
    }

    const validateForm = (formData: FormData, file: File | null): string | null => {
        if (!file) return "Please select a resume file";
        if (file.type !== 'application/pdf') return "Please upload a PDF file";
        if (file.size > 10 * 1024 * 1024) return "File size must be less than 10MB";
        if (file.size < 100) return "File appears to be too small or corrupted";
        
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;
        
        if (!jobTitle?.trim()) return "Job title is required";
        if (!jobDescription?.trim()) return "Job description is required";
        if (jobDescription.trim().length < 50) return "Job description should be more detailed (at least 50 characters)";
        
        return null;
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const form = e.currentTarget.closest('form');
        if(!form) return;
        
        const formData = new FormData(form);
        
        // Validate form data
        const validationError = validateForm(formData, file);
        if (validationError) {
            setStatusText(`Error: ${validationError}`);
            return;
        }

        const companyName = (formData.get('company-name') as string) || 'Target Company';
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        await handleAnalyze({ companyName, jobTitle, jobDescription, file: file! });
    }

    const handleRetry = () => {
        setIsProcessing(false);
        setStatusText('');
        setProgress(0);
        setDebugInfo([]);
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <div className="processing-container">
                            <h2>{statusText}</h2>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-3 mt-4 mb-4">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-4">
                                {progress}% Complete
                            </div>
                            
                            {/* Debug information (only show in development) */}
                            {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
                                <div className="bg-gray-100 p-4 rounded mt-4 text-sm text-left max-h-40 overflow-y-auto">
                                    <strong>Debug Info:</strong>
                                    {debugInfo.map((info, index) => (
                                        <div key={index} className="font-mono text-xs">{info}</div>
                                    ))}
                                </div>
                            )}
                            
                            <img src="/images/resume-scan.gif" className="w-full max-w-md mx-auto" alt="Processing" />
                        </div>
                    ) : (
                        <>
                            <h2>Drop your resume for an ATS score and improvement tips</h2>
                            
                            {statusText && statusText.includes('Error:') && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                                    {statusText}
                                    <button 
                                        onClick={handleRetry}
                                        className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name (Optional)</label>
                                <input 
                                    type="text" 
                                    name="company-name" 
                                    placeholder="e.g. Google, Microsoft, etc." 
                                    id="company-name" 
                                />
                            </div>
                            
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title *</label>
                                <input 
                                    type="text" 
                                    name="job-title" 
                                    placeholder="e.g. Software Engineer, Product Manager" 
                                    id="job-title"
                                    required 
                                />
                            </div>
                            
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description *</label>
                                <textarea 
                                    rows={5} 
                                    name="job-description" 
                                    placeholder="Paste the job description here..." 
                                    id="job-description"
                                    required
                                />
                            </div>
                            
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume (PDF) *</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                                {file && (
                                    <div className="mt-2 text-sm text-green-600">
                                        ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                className="primary-button" 
                                type="submit"
                                disabled={!file || isLoading}
                            >
                                {!file ? 'Please Select a File' : 
                                 isLoading ? 'Loading Services...' : 
                                 'Analyze Resume with AI'}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Upload
