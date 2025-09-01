import React from 'react';
import { Link } from 'react-router-dom';
import './not-found.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">404</div>
        <h1>Project Not Found</h1>
        <p>The project you're looking for doesn't exist or has been removed.</p>
        <div className="not-found-details">
          <p>This could be due to:</p>
          <ul>
            <li>An incorrect or expired share link</li>
            <li>A project that has been deleted</li>
            <li>A typo in the URL</li>
          </ul>
        </div>
        <Link to="/" className="not-found-button">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
