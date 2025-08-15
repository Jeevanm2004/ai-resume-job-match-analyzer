# AI Resume & Job Match Analyzer
**Built by Jeevan M**

A powerful AI-driven application that analyzes resumes using Google Gemini AI, providing comprehensive ATS (Applicant Tracking System) scoring and intelligent improvement suggestions to help job seekers optimize their resumes.

## 🚀 Features

✅ **Smart Resume Analysis**: Upload PDF/DOCX resumes and get instant AI-powered insights using Google Gemini  
✅ **ATS Score Calculation**: Get detailed scoring based on industry-standard ATS systems  
✅ **AI Improvement Suggestions**: Receive personalized recommendations to enhance your resume  
✅ **Real-time Processing**: Fast analysis with immediate results  
✅ **Modern UI/UX**: Clean, responsive design built with React and Tailwind CSS  
✅ **Secure & Private**: Your resume data is processed securely and not stored  

## 🛠️ Tech Stack

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS  
**AI Integration**: Google Gemini API  
**File Processing**: PDF-Parse, Mammoth (for DOCX)  
**Routing**: React Router  
**Build Tool**: Vite  
**Deployment**: Ready for Vercel, Netlify, or any static hosting  

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- npm or yarn package manager
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jeevanm2004/ai-resume-job-match-analyzer.git
   cd ai-resume-job-match-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**  
   Navigate to `http://localhost:5173`

## 🎯 How to Use

1. **Upload Your Resume**: Click to upload or drag & drop your PDF/DOCX resume
2. **Get AI Analysis**: The app automatically processes your resume using Google Gemini AI
3. **Review Results**:
   - View your overall resume score
   - See detailed breakdowns for Tone & Style, Content, Structure, and Skills
   - Get your ATS compatibility score (how well it performs with automated screening)
4. **Implement Suggestions**: Follow the AI-generated recommendations to improve your resume
5. **Re-analyze**: Upload your updated resume to see improved scores

## 📁 Project Structure

```
ai-resume-job-match-analyzer/
├── app/                    # Main application components
│   ├── components/         # Reusable React components
│   ├── lib/               # Utility functions and API calls
│   ├── routes/            # Route components
│   └── ...
├── constants/             # Application constants
├── public/               # Static assets
├── types/                # TypeScript type definitions
├── .env.local            # Environment variables (create this)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

## 🔐 Environment Setup

**Required Environment Variable:**

```env
# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```

**How to get your API key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste it into your `.env.local` file

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Deploy the 'dist' folder to Netlify
```

**Important**: Remember to add your `VITE_GEMINI_API_KEY` environment variable in your deployment platform's settings.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Developer

**Jeevan M**
- GitHub: [@Jeevanm2004](https://github.com/Jeevanm2004)
- LinkedIn: [linkedin.com/in/jeevanabhi](https://www.linkedin.com/in/jeevanabhi)
- Email: jeevanm.bit@gmail.com

## 📊 Current Status (Phase 2 Complete!)

✅ **AI Integration**: Fully integrated with Google Gemini API  
✅ **Resume Processing**: Supports PDF and DOCX file formats  
✅ **Dynamic Analysis**: Real-time AI-powered resume analysis  
✅ **ATS Scoring**: Intelligent scoring algorithm  
✅ **Modern UI**: Clean, responsive React interface  
✅ **Production Ready**: Ready for deployment and real-world use  

## 🔮 Future Enhancements (Phase 3+)

🔄 **Planned Features**:
- Job description matching and comparison
- Multiple resume format support (TXT, images)
- Resume improvement suggestions with before/after comparisons
- Batch processing for multiple resumes
- Advanced analytics dashboard
- Integration with job boards

## 🎉 Demo

Try the live application: [Add your deployment URL here]

## 🙏 Acknowledgments

- Built with Google Gemini AI for intelligent resume analysis
- Thanks to the React and TypeScript community
- Inspired by the need for better job application tools

---

⭐ **Star this repository if you find it helpful!**

🐛 **Found a bug?** [Report it here](https://github.com/Jeevanm2004/ai-resume-job-match-analyzer/issues)

💡 **Have a feature request?** [Let me know!](https://github.com/Jeevanm2004/ai-resume-job-match-analyzer/discussions)
