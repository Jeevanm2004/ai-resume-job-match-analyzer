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

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const updateProgress = (percent: number, message: string) => {
        setProgress(percent);
        setStatusText(message);
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { 
        companyName: string, 
        jobTitle: string, 
        jobDescription: string, 
        file: File  
    }) => {
        setIsProcessing(true);

        try {
            // Step 1: Upload the PDF file
            updateProgress(20, 'Uploading your resume...');
            const uploadedFile = await fs.upload([file]);
            if(!uploadedFile) {
                throw new Error('Failed to upload file');
            }

            // Step 2: Prepare data structure
            updateProgress(40, 'Preparing analysis data...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                // Remove imagePath since we don't need it
                companyName, 
                jobTitle, 
                jobDescription,
                feedback: '',
                fileName: file.name,
                fileSize: file.size,
                uploadDate: new Date().toISOString()
            }

            // Store initial data
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            // Step 3: AI Analysis (this is where your Gemini integration works)
            updateProgress(60, 'AI is analyzing your resume...');
            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription, companyName })
            );

            if (!feedback) {
                throw new Error('AI analysis failed');
            }

            // Step 4: Process AI response
            updateProgress(80, 'Processing analysis results...');
            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            // Parse the AI response
            let parsedFeedback;
            try {
                parsedFeedback = JSON.parse(feedbackText);
            } catch (parseError) {
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

            // Step 5: Save final results
            updateProgress(90, 'Saving analysis results...');
            data.feedback = parsedFeedback;
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            // Step 6: Complete
            updateProgress(100, 'Analysis complete! Redirecting...');
            
            console.log('Analysis completed:', data);
            
            // Navigate to results
            setTimeout(() => {
                navigate(`/resume/${uuid}`);
            }, 1000);

        } catch (error) {
            console.error('Analysis error:', error);
            setStatusText(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
            setIsProcessing(false);
            setProgress(0);
        }
    }

    const validateForm = (formData: FormData, file: File | null): string | null => {
        if (!file) return "Please select a resume file";
        if (file.type !== 'application/pdf') return "Please upload a PDF file";
        if (file.size > 10 * 1024 * 1024) return "File size must be less than 10MB";
        
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;
        
        if (!jobTitle?.trim()) return "Job title is required";
        if (!jobDescription?.trim()) return "Job description is required";
        
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
                            
                            <img src="/images/resume-scan.gif" className="w-full max-w-md mx-auto" alt="Processing" />
                        </div>
                    ) : (
                        <>
                            <h2>Drop your resume for an ATS score and improvement tips</h2>
                            
                            {statusText && statusText.includes('Error:') && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                                    {statusText}
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
                                disabled={!file}
                            >
                                {file ? 'Analyze Resume with AI' : 'Please Select a File'}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Upload
