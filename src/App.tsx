import React, { useState, useEffect, useRef } from 'react';
// Import router components when needed in JSX
import { Routes, Route } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
// Import components used in the Routes
import ViewMode from './ViewMode';
import QRCodeModal from './QRCodeModal';
import NotFound from './NotFound';
import ShareOptionsModal from './ShareOptionsModal';
import ImageUpload from './components/ImageUpload';
import ImageView from './components/ImageView';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import { createShareLink, getShareLinks } from './supabaseClient';

// Import styles
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './minimal-styles.css';

// TypeScript interfaces
interface Pin {
  id: string;
  x: number;
  y: number;
  comment: string;
  status?: 'pending' | 'resolved';
  color?: string;
}

interface ShareLink {
  id: string;
  url: string;
  projectId: string;
  short_id: string;
  createdAt: Date;
  expiresAt: Date | null;
}

interface Project {
  id: string;
  name: string;
  pinshots: Pinshot[];
}

interface Pinshot {
  id: string;
  name: string;
  image: string | null;
  pins: Pin[];
}

// Main App component
const App = (): React.ReactElement => {
  // State management
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'My Project', pinshots: [{ id: '1', name: 'Screenshot', image: null, pins: [] }] }
  ]);
  const [activeProject, setActiveProject] = useState<string>('1');
  const [showCreateProject, setShowCreateProject] = useState(false); 
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number, y: number } | null>(null);
  const [pendingComment, setPendingComment] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedPinshot, setSelectedPinshot] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [currentShareUrl, setCurrentShareUrl] = useState<string>('');
  const [showShareOptions, setShowShareOptions] = useState<boolean>(false);
  const [pinColor, setPinColor] = useState<string>('#FF4D4F');

  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Navigate to view mode - commented out as currently unused
  // const goToViewMode = (projectData: string) => {
  //   setViewMode(true);
  //   // Additional logic for view mode navigation
  // };

  // Load share links from Supabase
  const loadShareLinks = async () => {
    if (activeProject) {
      try {
        const links = await getShareLinks(activeProject);
        if (!links || !Array.isArray(links)) {
          console.error('Invalid response from getShareLinks:', links);
          return;
        }
        
        const formattedLinks = links.map((link) => {
          if (!link || !link.short_id) {
            console.error('Invalid link object:', link);
            return null;
          }
          
          const shareLink: ShareLink = {
            id: link.id,
            url: `${window.location.origin}/view/${link.short_id}`,
            projectId: link.project_id,
            short_id: link.short_id,
            createdAt: new Date(link.created_at),
            expiresAt: link.expires_at ? new Date(link.expires_at) : null
          };
          return shareLink;
        }).filter(link => link !== null) as ShareLink[];
        
        setShareLinks(formattedLinks);
      } catch (error) {
        console.error('Error loading share links:', error);
        toast.error('Failed to load share links');
      }
    }
  };
  
  // Load share links when active project changes
  useEffect(() => {
    loadShareLinks();
  }, [activeProject]);

  // Handle project creation
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName,
        pinshots: []
      };
      setProjects([...projects, newProject]);
      setActiveProject(newProject.id);
      setNewProjectName('');
      setShowCreateProject(false);
    }
  };
  
  // Handle project deletion
  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      toast.error('Cannot delete the last project');
      return;
    }
    
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    
    if (activeProject === projectId) {
      setActiveProject(updatedProjects[0].id);
    }
  };
  
  // Handle project click
  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId);
    setSelectedPinshot(null);
  };
  
  // Handle pinshot click
  const handlePinshotClick = (pinshotId: string) => {
    setSelectedPinshot(pinshotId);
  };
  
  // Handle file change for image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeProject) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const currentProject = projects.find(p => p.id === activeProject);
        if (currentProject) {
          const newPinshot: Pinshot = {
            id: Date.now().toString(),
            name: file.name,
            image: event.target?.result as string,
            pins: []
          };
          
          const updatedProjects = projects.map(project => {
            if (project.id === activeProject) {
              return {
                ...project,
                pinshots: [...project.pinshots, newPinshot]
              };
            }
            return project;
          });
          
          setProjects(updatedProjects);
          setSelectedPinshot(newPinshot.id);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle adding a new pinshot
  const handleAddPinshot = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle image click to add a pin
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imageContainerRef.current && selectedPinshot) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setPendingPin({ x, y });
    }
  };
  
  // Handle pin click
  const handlePinClick = (pinId: string) => {
    setSelectedPin(pinId);
    setPendingPin(null);
  };
  
  // Handle comment change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPendingComment(e.target.value);
  };
  
  // Handle comment submit
  const handleCommentSubmit = () => {
    if (pendingPin && pendingComment && selectedPinshot) {
      const newPin: Pin = {
        id: Date.now().toString(),
        x: pendingPin.x,
        y: pendingPin.y,
        comment: pendingComment,
        status: 'pending',
        color: pinColor
      };
      
      const updatedProjects = projects.map(project => {
        if (project.id === activeProject) {
          return {
            ...project,
            pinshots: project.pinshots.map(pinshot => {
              if (pinshot.id === selectedPinshot) {
                return {
                  ...pinshot,
                  pins: [...pinshot.pins, newPin]
                };
              }
              return pinshot;
            })
          };
        }
        return project;
      });
      
      setProjects(updatedProjects);
      setPendingPin(null);
      setPendingComment('');
    }
  };
  
  // Handle status change
  const handleStatusChange = (pinId: string, status: 'pending' | 'resolved') => {
    const updatedProjects = projects.map(project => {
      if (project.id === activeProject) {
        return {
          ...project,
          pinshots: project.pinshots.map(pinshot => {
            if (pinshot.id === selectedPinshot) {
              return {
                ...pinshot,
                pins: pinshot.pins.map(pin => {
                  if (pin.id === pinId) {
                    return { ...pin, status };
                  }
                  return pin;
                })
              };
            }
            return pinshot;
          })
        };
      }
      return project;
    });
    
    setProjects(updatedProjects);
  };
  
  // Save projects to localStorage when they change
  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);
  
  // Get current project
  const currentProject = projects.find(p => p.id === activeProject);
  
  // Get current pinshot
  const currentPinshot = currentProject?.pinshots.find(p => p.id === selectedPinshot);
  
  // Get selected pin
  const currentPin = currentPinshot?.pins.find(p => p.id === selectedPin);
  
  // Handle share button click
  const handleShareClick = () => {
    setShowShareOptions(true);
  };
  
  // Handle QR code button click
  const handleQRCodeClick = (url: string) => {
    setCurrentShareUrl(url);
    setShowQRCode(true);
  };
  
  // No longer needed as share history is always visible
  
  // Generate share link
  const generateShareLink = async (expirationDays: number | null = null) => {
    if (!activeProject || !selectedPinshot) {
      toast.error('Please select a project and pinshot first');
      return;
    }
    
    setIsGeneratingLink(true);
    setShowShareOptions(false);
    
    try {
      const shareLink = await createShareLink(activeProject, expirationDays);
      
      if (shareLink) {
        const shareUrl = `${window.location.origin}/view/${shareLink.short_id}`;
        
        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Share link copied to clipboard');
          await loadShareLinks();
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
          toast.error('Failed to copy link');
        }
      } else {
        throw new Error('No share link returned from server');
      }
      
      // Reset loading state on success
      setIsGeneratingLink(false);
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
      setIsGeneratingLink(false);
    }
  };

  return (
    <>
      <Routes>
        <Route path="/view" element={<ViewMode />} />
        <Route path="/view/:id" element={<>
          <Navigation />
          <ImageView />
        </>} />
        <Route path="/upload" element={<>
          <Navigation />
          <ImageUpload />
        </>} />
        <Route path="/404" element={<NotFound />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/home" element={
          <div className="app-container">
            {/* Sidebar */}
            <div className={`sidebar ${showSidebar ? '' : 'collapsed'}`}>
              <div className="sidebar-header">
                <h1>Pinner</h1>
                <button onClick={() => setShowSidebar(!showSidebar)} className="toggle-sidebar">
                  {showSidebar ? '◀' : '▶'}
                </button>
              </div>
              
              {/* Project List */}
              <div className="project-list">
                <h2>Projects</h2>
                <ul>
                  {projects.map(project => (
                    <li 
                      key={project.id} 
                      className={project.id === activeProject ? 'active' : ''}
                      onClick={() => handleProjectClick(project.id)}
                    >
                      {project.name}
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="delete-btn">×</button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowCreateProject(true)} className="add-project-btn">+ New Project</button>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="main-content">
              {/* Create Project Modal */}
              {showCreateProject && (
                <div className="modal">
                  <div className="modal-content">
                    <h2>Create New Project</h2>
                    <input 
                      type="text" 
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project Name"
                    />
                    <div className="modal-actions">
                      <button onClick={() => setShowCreateProject(false)}>Cancel</button>
                      <button onClick={handleCreateProject}>Create</button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Project Content */}
              {currentProject && (
                <div className="project-content">
                  <div className="project-header">
                    <h2>{currentProject.name}</h2>
                    <div className="project-actions">
                      <button onClick={handleAddPinshot} className="add-pinshot-btn">+ Add Screenshot</button>
                      <button onClick={handleShareClick} className="share-btn" disabled={isGeneratingLink}>
                        {isGeneratingLink ? 'Generating...' : 'Share'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Pinshots */}
                  <div className="pinshots-container">
                    {currentProject.pinshots.length === 0 ? (
                      <div className="empty-state">
                        <p>No screenshots yet. Add your first screenshot to get started.</p>
                      </div>
                    ) : (
                      <div className="pinshots-grid">
                        {currentProject.pinshots.map(pinshot => (
                          <div 
                            key={pinshot.id} 
                            className={`pinshot-item ${pinshot.id === selectedPinshot ? 'selected' : ''}`}
                            onClick={() => handlePinshotClick(pinshot.id)}
                          >
                            {pinshot.image ? (
                              <img src={pinshot.image} alt={pinshot.name} />
                            ) : (
                              <div className="placeholder">No Image</div>
                            )}
                            <div className="pinshot-name">{pinshot.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Pinshot */}
                  {currentPinshot && (
                    <div className="pinshot-detail">
                      <div 
                        className="image-container" 
                        ref={imageContainerRef}
                        onClick={handleImageClick}
                      >
                        {currentPinshot.image && (
                          <img src={currentPinshot.image} alt={currentPinshot.name} />
                        )}
                        
                        {/* Pins */}
                        {currentPinshot.pins.map(pin => (
                          <div 
                            key={pin.id}
                            className={`pin ${pin.status} ${pin.id === selectedPin ? 'selected' : ''}`}
                            style={{ 
                              left: `${pin.x}%`, 
                              top: `${pin.y}%`,
                              backgroundColor: pin.color || '#FF4D4F'
                            }}
                            onClick={(e) => { e.stopPropagation(); handlePinClick(pin.id); }}
                          ></div>
                        ))}
                        
                        {/* Pending Pin */}
                        {pendingPin && (
                          <div 
                            className="pin pending"
                            style={{ 
                              left: `${pendingPin.x}%`, 
                              top: `${pendingPin.y}%`,
                              backgroundColor: pinColor
                            }}
                          ></div>
                        )}
                      </div>
                      
                      {/* Pin Detail */}
                      {currentPin && (
                        <div className="pin-detail">
                          <h3>Pin Details</h3>
                          <p>{currentPin.comment}</p>
                          <div className="pin-actions">
                            <select 
                              value={currentPin.status || 'pending'}
                              onChange={(e) => handleStatusChange(currentPin.id, e.target.value as 'pending' | 'resolved')}
                            >
                              <option value="pending">Pending</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        </div>
                      )}
                      
                      {/* Pending Pin Comment */}
                      {pendingPin && (
                        <div className="pending-pin-form">
                          <h3>Add Comment</h3>
                          <textarea 
                            value={pendingComment}
                            onChange={handleCommentChange}
                            placeholder="Enter your comment here..."
                          ></textarea>
                          <div className="color-picker">
                            <span>Pin Color:</span>
                            <button 
                              className={`color-option ${pinColor === '#FF4D4F' ? 'selected' : ''}`}
                              style={{ backgroundColor: '#FF4D4F' }}
                              onClick={() => setPinColor('#FF4D4F')}
                            ></button>
                            <button 
                              className={`color-option ${pinColor === '#52C41A' ? 'selected' : ''}`}
                              style={{ backgroundColor: '#52C41A' }}
                              onClick={() => setPinColor('#52C41A')}
                            ></button>
                            <button 
                              className={`color-option ${pinColor === '#1890FF' ? 'selected' : ''}`}
                              style={{ backgroundColor: '#1890FF' }}
                              onClick={() => setPinColor('#1890FF')}
                            ></button>
                          </div>
                          <div className="form-actions">
                            <button onClick={() => setPendingPin(null)}>Cancel</button>
                            <button onClick={handleCommentSubmit}>Save</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Share Links Section - Always visible but conditionally populated */}
              <div className="share-history">
                <div className="share-header">
                  <h3>Share Links</h3>
                  <button onClick={handleShareClick} className="share-btn-small" disabled={isGeneratingLink}>
                    {isGeneratingLink ? 'Generating...' : '+ New Link'}
                  </button>
                </div>
                {shareLinks.length === 0 ? (
                  <p className="no-links">No share links created yet. Click '+ New Link' to create one.</p>
                ) : (
                  <ul>
                    {shareLinks.map(link => (
                      <li key={link.id}>
                        <div className="share-link-info">
                          <span className="share-url">{link.url}</span>
                          <span className="share-date">
                            Created: {link.createdAt.toLocaleDateString()}
                            {link.expiresAt && (
                              <> | Expires: {link.expiresAt.toLocaleDateString()}</>
                            )}
                          </span>
                        </div>
                        <div className="share-actions">
                          <button onClick={() => navigator.clipboard.writeText(link.url)}>Copy</button>
                          <button onClick={() => handleQRCodeClick(link.url)}>QR Code</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        } />
      </Routes>
      
      {/* Share Options Modal */}
      {showShareOptions && (
        <ShareOptionsModal 
          onClose={() => setShowShareOptions(false)}
          onShare={generateShareLink}
        />
      )}
      
      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeModal 
          url={currentShareUrl}
          onClose={() => setShowQRCode(false)}
          projectName={currentProject?.name || 'Project'}
          onPreview={() => window.open(currentShareUrl, '_blank')}
        />
      )}
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleFileChange}
      />
      <ToastContainer position="bottom-right" />
    </>
  );
};

export default App;
