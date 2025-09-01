import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { isShareLinkValid, getProjectByShareLink } from './supabaseClient';
import './view-mode.css';

// TypeScript interfaces
interface Pin {
  id: string;
  x: number;
  y: number;
  comment: string;
  status?: 'pending' | 'resolved';
  color?: string;
}

interface Project {
  id: string;
  name: string;
  image: string | null;
  pins: Pin[];
}

interface ShareLink {
  id: string;
  url: string;
  projectId: string;
  createdAt: Date;
  expiresAt?: Date | null;
}

// ViewMode component for displaying shared projects in read-only mode
const ViewMode: React.FC = () => {
  // State for active pin to show comment
  const [activePinId, setActivePinId] = useState<string | null>(null);
  // State to track which pins have been animated
  const [animatedPins, setAnimatedPins] = useState<Set<string>>(new Set());
  // State to track if initial animation is complete
  const [initialAnimationComplete, setInitialAnimationComplete] = useState<boolean>(false);
  // State to track if project is expired
  const [isExpired, setIsExpired] = useState<boolean>(false);
  // State to hold the project data
  const [project, setProject] = useState<Project | null>(null);
  // State to track loading status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Get project ID from URL params or query params
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const projectData = searchParams.get('data');
  const navigate = useNavigate();
  
  // Effect to load project data and check expiration
  useEffect(() => {
    const loadProject = async () => {
      setIsLoading(true);
      
      try {
        if (id) {
          // If we have a short ID, check if it's valid and get project from Supabase
          const isValid = await isShareLinkValid(id);
          
          if (!isValid) {
            setIsExpired(true);
            setIsLoading(false);
            return;
          }
          
          // Get project data from Supabase
          const projectData = await getProjectByShareLink(id);
          
          if (!projectData) {
            setIsLoading(false);
            return;
          }
          
          setProject(projectData);
        } else if (projectData) {
          // Legacy support for base64 encoded data in URL
          // This will be deprecated once all links are migrated to the new format
          try {
            const parsedProject = JSON.parse(atob(projectData));
            setProject(parsedProject);
            
            // For legacy links, we still check localStorage for expiration
            const shareLinks = localStorage.getItem('pinner_share_links');
            if (shareLinks) {
              const links: ShareLink[] = JSON.parse(shareLinks);
              
              const matchingLink = links.find(link => {
                return link.url.includes(encodeURIComponent(projectData));
              });
              
              if (matchingLink && matchingLink.expiresAt) {
                const expiryDate = new Date(matchingLink.expiresAt);
                if (expiryDate < new Date()) {
                  setIsExpired(true);
                }
              }
            }
          } catch (error) {
            console.error('Error parsing project data:', error);
            setIsLoading(false);
          }
        } else {
          // No ID or data provided
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [id, projectData]);

  // Handle pin click to show/hide comment
  const handlePinClick = (e: React.MouseEvent, pinId: string) => {
    e.stopPropagation();
    setActivePinId(activePinId === pinId ? null : pinId);
    
    // Add pulse animation to the clicked pin
    if (activePinId !== pinId) {
      const newAnimatedPins = new Set(animatedPins);
      newAnimatedPins.add(pinId);
      setAnimatedPins(newAnimatedPins);
    } else {
      // Remove animation when closing
      const newAnimatedPins = new Set(animatedPins);
      newAnimatedPins.delete(pinId);
      setAnimatedPins(newAnimatedPins);
    }
  };
  
  // Effect to animate pins sequentially on load
  useEffect(() => {
    if (!project || initialAnimationComplete) return;
    
    const pins = project.pins || [];
    if (pins.length === 0) {
      setInitialAnimationComplete(true);
      return;
    }
    
    // Animate pins one by one with a delay
    pins.forEach((pin, index) => {
      setTimeout(() => {
        setAnimatedPins(prev => new Set([...prev, pin.id]));
        
        // Mark animation as complete after the last pin
        if (index === pins.length - 1) {
          setInitialAnimationComplete(true);
        }
      }, 300 * index); // 300ms delay between each pin
    });
  }, [project, initialAnimationComplete]);

  // Effect to redirect to 404 page if the link is expired
  useEffect(() => {
    if (isExpired) {
      navigate('/404');
    }
  }, [isExpired, navigate]);

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="view-mode-container">
        <div className="view-mode-content loading">
          <div className="loading-spinner"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }
  
  // If no project data found or link is expired
  if (!project || isExpired) {
    return (
      <div className="view-mode-container">
        <div className="view-mode-header">
          <Link to="/" className="back-link">
            ← Back to Editor
          </Link>
          <h1>Project Not Found</h1>
        </div>
        <div className="view-mode-content error">
          <div className="error-message">
            <h2>Oops! This project doesn't exist or has been removed.</h2>
            <p>The link you followed may be incorrect or the project may have been deleted.</p>
            <Link to="/" className="primary-button">
              Go to Editor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-mode-container">
      <div className="view-mode-header">
        <Link to="/" className="back-link">
          ← Back to Editor
        </Link>
        <h1>{project.name}</h1>
        <div className="view-mode-badge">View Only</div>
      </div>
      
      <div className="view-mode-content">
        <div className="view-mode-image-container">
          <img 
            src={project.image || ''} 
            alt={project.name} 
            className="view-mode-image"
          />
          
          {/* Display pins */}
          {project.pins.map(pin => (
            <div 
              key={pin.id}
              className={`pin ${animatedPins.has(pin.id) ? 'animated' : ''}`}
              style={{ 
                left: `${pin.x}%`, 
                top: `${pin.y}%`,
                animationDelay: `${project.pins.findIndex(p => p.id === pin.id) * 300}ms`,
              }}
              onClick={(e) => handlePinClick(e, pin.id)}
            >
              <div 
                className="pin-icon"
                style={{ backgroundColor: pin.color || '#FF4D4F' }}
              >
                <span className="pin-number">{pin.id.slice(-1)}</span>
              </div>
              {activePinId === pin.id && (
                <div className="comment-bubble">
                  <div className="comment-header">
                    <span className="comment-title">Pin {pin.id.slice(-1)}</span>
                    <span className={`comment-status ${pin.status || 'pending'}`}>
                      {pin.status || 'Pending'}
                    </span>
                  </div>
                  <div className="comment-text">{pin.comment}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="view-mode-sidebar">
          <div className="comments-section">
            <h4>Comments ({project.pins.length})</h4>
            
            {project.pins.length > 0 ? (
              <div className="comments-list">
                {project.pins.map(pin => (
                  <div 
                    key={pin.id} 
                    className="comment-item"
                    onClick={(e) => handlePinClick(e, pin.id)}
                  >
                    <div 
                      className="comment-pin-icon"
                      style={{ backgroundColor: pin.color || '#FF4D4F' }}
                    >
                      <span className="pin-number-small">{pin.id.slice(-1)}</span>
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-title">Pin {pin.id.slice(-1)}</span>
                        <span className={`comment-status ${pin.status || 'pending'}`}>
                          {pin.status || 'Pending'}
                        </span>
                      </div>
                      <div className="comment-text">{pin.comment}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-comments">No comments yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMode;
