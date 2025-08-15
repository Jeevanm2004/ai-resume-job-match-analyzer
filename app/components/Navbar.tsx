import {Link} from "react-router";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/" className="flex items-center gap-3">
                {/* Option 1: Custom Logo Image (replace with your logo file) */}
                {/* <img src="/images/your-logo.svg" alt="Resumind" className="h-8 w-auto" /> */}
                
                {/* Option 2: Icon + Text Logo */}
                <div className="flex items-center gap-2">
                    <div className="logo-icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" className="text-gradient-icon">
                            <rect x="4" y="6" width="24" height="20" rx="3" fill="url(#gradient1)" />
                            <rect x="8" y="10" width="16" height="2" rx="1" fill="white" opacity="0.9" />
                            <rect x="8" y="14" width="12" height="2" rx="1" fill="white" opacity="0.7" />
                            <rect x="8" y="18" width="14" height="2" rx="1" fill="white" opacity="0.5" />
                            <defs>
                                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="50%" stopColor="#06B6D4" />
                                    <stop offset="100%" stopColor="#1E40AF" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="logo-text">ResumeEdge</span>
                </div>
                
                {/* Option 3: Text-only with enhanced styling */}
                {/* <span className="logo-text-enhanced">RESUMIND</span> */}
            </Link>
            <Link to="/upload" className="primary-button w-fit">
                Upload Resume
            </Link>
        </nav>
    )
}

export default Navbar
