import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import SocialShareButtons from './SocialShareButtons';
import './qr-code-modal.css';

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
  projectName?: string;
  onPreview?: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ url, onClose, projectName = 'Project', onPreview }) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast('URL copied to clipboard!');
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="qr-close-button" onClick={onClose}>×</button>
        <h3>Scan QR Code to View Project</h3>
        <div className="qr-code-container">
          <QRCodeSVG 
            value={url} 
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={true}
          />
        </div>
        <p className="qr-code-url">{url}</p>
        <div className="qr-code-actions">
          <button 
            className="copy-btn"
            onClick={handleCopyLink}
          >
            Copy Link
          </button>
          {onPreview && (
            <button 
              className="preview-btn"
              onClick={onPreview}
            >
              Preview
            </button>
          )}
          <button 
            className="close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        
        {/* Social Share Buttons */}
        <SocialShareButtons url={url} title={`Check out my ${projectName} feedback`} />
      </div>
    </div>
  );
};

export default QRCodeModal;
