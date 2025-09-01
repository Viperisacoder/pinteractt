import React, { useState } from 'react';
import './share-options-modal.css';

interface ShareOptionsModalProps {
  onClose: () => void;
  onShare: (expirationDays: number | null) => void;
}

const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({ onClose, onShare }) => {
  const [expirationOption, setExpirationOption] = useState<string>('never');
  
  const handleShare = () => {
    let expirationDays: number | null = null;
    
    switch (expirationOption) {
      case '1day':
        expirationDays = 1;
        break;
      case '7days':
        expirationDays = 7;
        break;
      case '30days':
        expirationDays = 30;
        break;
      case 'never':
      default:
        expirationDays = null;
    }
    
    onShare(expirationDays);
  };
  
  return (
    <div className="share-options-overlay" onClick={onClose}>
      <div className="share-options-content" onClick={(e) => e.stopPropagation()}>
        <h3>Share Options</h3>
        
        <div className="share-options-form">
          <div className="form-group">
            <label htmlFor="expiration">Link Expiration</label>
            <select 
              id="expiration" 
              value={expirationOption}
              onChange={(e) => setExpirationOption(e.target.value)}
              className="expiration-select"
            >
              <option value="never">Never expire</option>
              <option value="1day">Expire after 1 day</option>
              <option value="7days">Expire after 7 days</option>
              <option value="30days">Expire after 30 days</option>
            </select>
          </div>
          
          <div className="share-options-info">
            <p>
              {expirationOption === 'never' 
                ? 'Your share link will never expire and will be accessible indefinitely.'
                : `Your share link will expire after ${expirationOption === '1day' ? '1 day' : 
                   expirationOption === '7days' ? '7 days' : '30 days'} and will no longer be accessible.`
              }
            </p>
          </div>
        </div>
        
        <div className="share-options-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="share-btn" onClick={handleShare}>Generate Share Link</button>
        </div>
      </div>
    </div>
  );
};

export default ShareOptionsModal;
