# AI Resume & Job Match Analyzer

**Built by Jeevan M**

A powerful full-stack AI SaaS application that revolutionizes the job application process by intelligently matching resumes to job descriptions and providing comprehensive ATS (Applicant Tracking System) scoring with AI-driven improvement suggestions.

![AI Resume Analyzer](public/images/resume-scan.gif)

## 🚀 Features

- **Smart Resume Analysis**: Upload your resume and get instant AI-powered insights
- **Job Matching Algorithm**: Compare your resume against specific job descriptions
- **ATS Score Calculation**: Get detailed scoring based on industry-standard ATS systems
- **AI Improvement Suggestions**: Receive personalized recommendations to enhance your resume
- **Real-time Processing**: Fast, in-browser analysis with no backend required
- **Modern UI/UX**: Clean, responsive design built with React and Tailwind CSS
- **Secure & Private**: All processing happens client-side, your data stays with you

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Puter.js (serverless architecture)
- **Routing**: React Router
- **State Management**: Zustand
- **Build Tool**: Vite
- **Deployment**: Ready for Vercel, Netlify, or any static hosting

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- npm or yarn package manager
- Modern web browser with JavaScript enabled

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jeevanm2004/ai-resume-job-match-analyzer.git
   cd ai-resume-job-match-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your API keys and configuration:
   ```env
   VITE_PUTER_API_KEY=your_puter_api_key_here
   VITE_AI_API_KEY=your_ai_service_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage

1. **Upload Your Resume**: Drag and drop your resume (PDF format supported)
2. **Add Job Description**: Paste the job description you're applying for
3. **Get Analysis**: Click "Analyze Match" to get comprehensive results
4. **Review Insights**: 
   - View your ATS compatibility score
   - See keyword matching analysis
   - Get personalized improvement suggestions
5. **Optimize**: Make recommended changes and re-analyze for better scores

## 📁 Project Structure

```
ai-resume-job-match-analyzer/
├── app/                    # Main application components
│   ├── components/         # Reusable React components
│   ├── lib/               # Utility functions and helpers
│   ├── routes/            # Route components
│   └── ...
├── constants/             # Application constants
├── public/               # Static assets
│   ├── images/           # Project images and icons
│   └── icons/            # SVG icons
├── types/                # TypeScript type definitions
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
└── README.md
```

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Puter.js Configuration
VITE_PUTER_API_KEY=your_puter_api_key

# AI Service Configuration  
VITE_AI_API_KEY=your_openai_or_other_ai_key

# App Configuration
VITE_APP_NAME=AI Resume & Job Match Analyzer
VITE_APP_URL=http://localhost:5173
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Drag and drop the 'dist' folder to Netlify
```

### Docker
```bash
docker build -t ai-resume-analyzer .
docker run -p 3000:3000 ai-resume-analyzer
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Jeevan M**
- GitHub: [@Jeevanm2004](https://github.com/Jeevanm2004)
- LinkedIn: [www.linkedin.com/in/jeevanabhi](https://www.linkedin.com/in/jeevanabhi)
- Email: jeevanm.bit@gmail.com

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the need for better job application tools
- Thanks to the open-source community for amazing libraries and tools

## 📊 Project Status

- ✅ Core functionality implemented
- ✅ Resume upload and parsing
- ✅ AI-powered analysis
- ✅ ATS scoring algorithm
- 🔄 Continuous improvements and feature additions
- 📈 Performance optimizations ongoing

## 🔮 Future Enhancements

- [ ] Multiple resume format support (DOCX, TXT)
- [ ] Bulk job application analysis
- [ ] Resume template suggestions
- [ ] Integration with job boards
- [ ] Mobile app version
- [ ] Advanced analytics dashboard

---

⭐ **Star this repository if you find it helpful!**

🐛 **Found a bug?** [Report it here](https://github.com/Jeevanm2004/ai-resume-job-match-analyzer/issues)

💡 **Have a feature request?** [Let me know!](https://github.com/Jeevanm2004/ai-resume-job-match-analyzer/discussions)
