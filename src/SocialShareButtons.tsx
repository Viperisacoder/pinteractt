import React from 'react';
import './social-share-buttons.css';

interface SocialShareButtonsProps {
  url: string;
  title: string;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ url, title }) => {
  // Encode URL and title for sharing
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  // Share handlers
  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank', 'noopener,noreferrer');
  };

  const handleEmailShare = () => {
    window.open(`mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A${encodedUrl}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="social-share-container">
      <h4>Share via</h4>
      <div className="social-buttons">
        <button 
          className="social-button twitter" 
          onClick={handleTwitterShare}
          aria-label="Share on Twitter"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
          </svg>
        </button>
        <button 
          className="social-button facebook" 
          onClick={handleFacebookShare}
          aria-label="Share on Facebook"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8.615v-6.96h-2.338v-2.725h2.338v-2c0-2.325 1.42-3.592 3.5-3.592.699-.002 1.399.034 2.095.107v2.42h-1.435c-1.128 0-1.348.538-1.348 1.325v1.735h2.697l-.35 2.725h-2.348V21H20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" />
          </svg>
        </button>
        <button 
          className="social-button linkedin" 
          onClick={handleLinkedInShare}
          aria-label="Share on LinkedIn"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        </button>
        <button 
          className="social-button email" 
          onClick={handleEmailShare}
          aria-label="Share via Email"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SocialShareButtons;
