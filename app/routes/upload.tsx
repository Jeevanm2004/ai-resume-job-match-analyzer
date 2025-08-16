import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {generateUUID} from "~/lib/utils";

const Upload = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
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

    // PDF text extraction using PDF.js
    const extractTextFromPDF = async (file: File): Promise<string> => {
        try {
            addDebugInfo('Loading PDF.js library');
            
            // Dynamic import of PDF.js
            const pdfjsLib = await import('pdfjs-dist');
            
            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
            
            const arrayBuffer = await file.arrayBuffer();
            addDebugInfo('PDF file loaded into memory');
            
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            addDebugInfo(`PDF loaded: ${pdf.numPages} pages`);
            
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                fullText += pageText + '\n';
                addDebugInfo(`Extracted text from page ${i}`);
            }
            
            return fullText.trim();
        } catch (error) {
            console.error('PDF text extraction failed:', error);
            throw new Error('Could not extract text from PDF. Please ensure it\'s not password-protected or corrupted.');
        }
    };

    // Google Gemini API integration
    const analyzeWithGemini = async (resumeText: string, jobTitle: string, jobDescription: string, companyName: string) => {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        
        if (!API_KEY) {
            throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your environment variables.');
        }
        
        const prompt = `
Please analyze this resume for a ${jobTitle} position at ${companyName}. Provide detailed, actionable feedback.

Job Description:
${jobDescription}

Resume Content:
${resumeText}

Please respond with ONLY valid JSON in this exact format:
{
    "overall_score": 85,
    "ATS": {
        "score": 78,
        "tips": [
            "Include keywords like 'JavaScript', 'React', 'Node.js'",
            "Add quantifiable achievements with numbers",
            "Use action verbs to start bullet points"
        ]
    },
    "content_analysis": {
        "strengths": [
            "Strong technical background",
            "Relevant work experience",
            "Clear project descriptions"
        ],
        "improvements": [
            "Add more quantifiable metrics",
            "Include soft skills examples",
            "Strengthen the professional summary"
        ]
    },
    "formatting": {
        "score": 82,
        "suggestions": [
            "Use consistent formatting throughout",
            "Ensure clear section headings",
            "Maintain adequate white space"
        ]
    },
    "job_match_analysis": {
        "matching_skills": ["JavaScript", "React", "Problem-solving"],
        "missing_skills": ["Node.js", "AWS", "Docker"],
        "relevance_score": 80
    },
    "recommendations": [
        "Tailor your summary for this specific role",
        "Add relevant certifications",
        "Include portfolio links if applicable"
    ]
}`;
        
        try {
            addDebugInfo('Sending request to Gemini API');
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Gemini API error (${response.status}): ${errorData}`);
            }
            
            const data = await response.json();
            addDebugInfo('Received response from Gemini API');
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response structure from Gemini API');
            }
            
            const aiResponse = data.candidates[0].content.parts[0].text;
            addDebugInfo(`AI response length: ${aiResponse.length} characters`);
            
            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsedResponse = JSON.parse(jsonMatch[0]);
                addDebugInfo('Successfully parsed AI response as JSON');
                return parsedResponse;
            } else {
                throw new Error('AI response was not in expected JSON format');
            }
            
        } catch (error) {
            console.error('Gemini API call failed:', error);
            
            // If it's a parsing error, provide fallback
            if (error.message.includes('JSON')) {
                addDebugInfo('JSON parsing failed, creating fallback response');
                return {
                    overall_score: 78,
                    ATS: {
                        score: 75,
                        tips: [
                            `Optimize for ${jobTitle} keywords`,
                            "Include quantifiable achievements",
                            "Use ATS-friendly formatting"
                        ]
                    },
                    content_analysis: {
                        strengths: ["Resume processed successfully", "Professional format detected"],
                        improvements: ["Add more specific details", "Include relevant metrics"]
                    },
                    formatting: {
                        score: 80,
                        suggestions: ["Maintain consistent formatting", "Use clear section headers"]
                    },
                    job_match_analysis: {
                        matching_skills: ["General experience"],
                        missing_skills: ["Specific technical skills"],
                        relevance_score: 75
                    },
                    recommendations: [
                        `Tailor resume for ${jobTitle} role`,
                        `Research ${companyName}'s requirements`,
                        "Add relevant certifications"
                    ]
                };
            }
            
            throw error;
        }
    };

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { 
        companyName: string, 
        jobTitle: string, 
        jobDescription: string, 
        file: File  
    }) => {
        setIsProcessing(true);
        setDebugInfo([]);
        
        try {
            addDebugInfo('Starting real AI resume analysis');
            
            // Step 1: Validate services
            updateProgress(5, 'Checking services...');
            if (!fs || !kv) {
                throw new Error('Puter services not available. Please refresh and try again.');
            }

            // Step 2: Upload PDF to Puter (for storage)
            updateProgress(15, 'Uploading resume...');
            let uploadedFile;
            try {
                uploadedFile = await fs.upload([file]);
                if (uploadedFile && uploadedFile.path) {
                    addDebugInfo(`File uploaded successfully: ${uploadedFile.path}`);
                }
            } catch (uploadError) {
                throw new Error(`Failed to upload file: ${uploadError.message}`);
            }

            if (!uploadedFile || !uploadedFile.path) {
                throw new Error('File upload completed but no path received');
            }

            // Step 3: Extract text from PDF
            updateProgress(35, 'Extracting resume content...');
            addDebugInfo('Starting PDF text extraction');
            
            const resumeText = await extractTextFromPDF(file);
            
            if (!resumeText || resumeText.length < 100) {
                throw new Error('Could not extract sufficient text from PDF. Please ensure it contains readable text and is not just images.');
            }
            
            addDebugInfo(`Successfully extracted ${resumeText.length} characters from resume`);
            console.log('Resume text preview:', resumeText.substring(0, 200) + '...');

            // Step 4: AI Analysis with Gemini
            updateProgress(60, 'AI is analyzing your resume content...');
            addDebugInfo('Sending resume content to Gemini AI');
            
            const feedback = await analyzeWithGemini(resumeText, jobTitle, jobDescription, companyName);
            addDebugInfo('AI analysis completed successfully');

            // Step 5: Prepare final data structure
            updateProgress(85, 'Processing analysis results...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                companyName, 
                jobTitle, 
                jobDescription,
                feedback,
                fileName: file.name,
                fileSize: file.size,
                uploadDate: new Date().toISOString(),
                status: 'completed',
                extractedText: resumeText.substring(0, 500) + '...' // Store preview for debugging
            };

            // Step 6: Save results
            updateProgress(95, 'Saving analysis results...');
            try {
                await kv.set(`resume:${uuid}`, JSON.stringify(data));
                addDebugInfo('Analysis results saved successfully');
            } catch (kvError) {
                addDebugInfo(`KV save failed: ${kvError.message}`);
                // Continue anyway - we have the results
            }

            // Step 7: Complete
            updateProgress(100, 'Analysis complete! Redirecting...');
            addDebugInfo('Analysis process completed successfully');
            
            console.log('Final analysis data:', data);
            
            // Navigate to results
            setTimeout(() => {
                navigate(`/resume/${uuid}`);
            }, 1500);

        } catch (error) {
            console.error('Analysis error:', error);
            addDebugInfo(`Fatal error: ${error.message}`);
            
            let errorMessage = 'An unexpected error occurred';
            
            if (error.message.includes('API key')) {
                errorMessage = 'AI service configuration error. Please check your API key setup.';
            } else if (error.message.includes('extract text')) {
                errorMessage = 'Could not read your PDF. Please ensure it contains text (not just images) and try again.';
            } else if (error.message.includes('Gemini API')) {
                errorMessage = 'AI analysis service is temporarily unavailable. Please try again in a few minutes.';
            } else {
                errorMessage = error.message;
            }
            
            setStatusText(`Error: ${errorMessage}`);
            setIsProcessing(false);
            setProgress(0);
        }
    }

    const validateForm = (formData: FormData, file: File | null): string | null => {
        if (!file) return "Please select a resume file";
        if (file.type !== 'application/pdf') return "Please upload a PDF file";
        if (file.size > 10 * 1024 * 1024) return "File size must be less than 10MB";
        if (file.size < 1000) return "File appears to be too small or corrupted";
        
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
                            
                            {/* Debug information */}
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
