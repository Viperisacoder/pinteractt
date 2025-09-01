import { Link } from 'react-router-dom';
import Navigation from './Navigation';
import './ImageShare.css';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <div className="home-container">
        <div className="hero-section">
          <h1>Share Your Images Easily</h1>
          <p className="hero-description">
            Upload, share, and discuss images with friends and colleagues
          </p>
          <div className="hero-actions">
            <Link to="/upload" className="primary-button">
              Upload an Image
            </Link>
          </div>
        </div>
        
        <div className="features-section">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📤</div>
              <h3>Easy Upload</h3>
              <p>Upload your images with just a few clicks</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Shareable Links</h3>
              <p>Get a unique link to share your image with anyone</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Comments</h3>
              <p>Collect feedback and comments on your shared images</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
