import { Link } from 'react-router-dom';
import './ImageShare.css';

export default function Navigation() {
  return (
    <nav className="app-navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">Image Sharing App</Link>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/upload" className="nav-link">Upload Image</Link>
        </div>
      </div>
    </nav>
  );
}
