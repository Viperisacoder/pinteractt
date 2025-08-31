import React, { useState, useRef, useEffect } from 'react';
import './new-styles.css';

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
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
  image: string | null;
  pins: Pin[];
}

interface PinShot {
  id: string;
  name: string;
  image: string;
  status: 'pending' | 'resolved';
}

const App: React.FC = () => {
  // State management
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'My Project', image: null, pins: [] }
  ]);
  const [activeProject, setActiveProject] = useState<string>('1');
  const [showCreateProject, setShowCreateProject] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');
  const [pendingPin, setPendingPin] = useState<{ x: number, y: number } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [selectedPinshot, setSelectedPinshot] = useState<string | null>(null);
  const [pinColor, setPinColor] = useState<string>('#FF4D4F');
  const [projectMenuOpen, setProjectMenuOpen] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<boolean>(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [showShareHistory, setShowShareHistory] = useState<boolean>(false);
  
  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get current project
  const currentProject = projects.find(p => p.id === activeProject) || projects[0];

  // Handle project creation
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName,
        image: null,
        pins: []
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
      alert('Cannot delete the last project');
      return;
    }
    
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    
    // If the active project is being deleted, set another project as active
    if (projectId === activeProject) {
      setActiveProject(updatedProjects[0].id);
    }
    
    setProjectMenuOpen(null);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const updatedProjects = projects.map(project => {
          if (project.id === activeProject) {
            return { ...project, image: event.target?.result as string };
          }
          return project;
        });
        setProjects(updatedProjects);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image click to add a pin - only when clicking directly on the image
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if we're clicking on the image element itself and not on a child element
    if (e.target !== e.currentTarget.querySelector('img')) return;
    if (!currentProject.image || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPendingPin({ x, y });
  };

  // Handle pin click
  const handlePinClick = (e: React.MouseEvent, pinId: string) => {
    e.stopPropagation();
    setActivePinId(activePinId === pinId ? null : pinId);
  };

  // Handle comment submission
  const handleCommentSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingPin && commentInput.trim()) {
      const newPin: Pin = {
        id: Date.now().toString(),
        x: pendingPin.x,
        y: pendingPin.y,
        comment: commentInput,
        status: 'pending',
        color: pinColor
      };
      
      const updatedProjects = projects.map(project => {
        if (project.id === activeProject) {
          return { ...project, pins: [...project.pins, newPin] };
        }
        return project;
      });
      
      setProjects(updatedProjects);
      setPendingPin(null);
      setCommentInput('');
    }
  };

  // Handle comment cancellation
  const handleCommentCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingPin(null);
    setCommentInput('');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  // Toggle project menu
  const toggleProjectMenu = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectMenuOpen(projectMenuOpen === projectId ? null : projectId);
  };
  
  // Go back from detail view
  const goBackFromDetail = () => {
    setDetailView(false);
    setSelectedPinshot(null);
  };
  
  // Generate share link
  const generateShareLink = () => {
    setIsGeneratingLink(true);
    
    // Simulate API call to generate Vercel deployment
    setTimeout(() => {
      const newLink: ShareLink = {
        id: Date.now().toString(),
        url: `https://pinner-share-${Date.now().toString().slice(-6)}.vercel.app`,
        projectId: activeProject,
        createdAt: new Date()
      };
      
      setShareLinks(prev => [...prev, newLink]);
      setIsGeneratingLink(false);
      
      // Open the share link in a new window
      window.open(newLink.url, '_blank');
    }, 1500);
  };

  // Add a new pinshot
  const handleAddPinshot = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const updatedProjects = projects.map(project => {
          if (project.id === activeProject) {
            return { ...project, image: event.target?.result as string };
          }
          return project;
        });
        setProjects(updatedProjects);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Close active pin when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside a pin or comment
      if (
        e.target instanceof Node &&
        (document.querySelector('.pin')?.contains(e.target) ||
         document.querySelector('.comment-bubble')?.contains(e.target) ||
         document.querySelector('.comment-input-container')?.contains(e.target))
      ) {
        return;
      }
      setActivePinId(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Generate pinshots from current project
  const pinshots: PinShot[] = currentProject.image 
    ? [{
        id: '1',
        name: `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        image: currentProject.image,
        status: 'pending'
      }]
    : [];

  return (
    <div className="app">
      {/* Detail View Mode */}
      {detailView && selectedPinshot ? (
        <div className="detail-view-mode">
          <header className="detail-header">
            <button className="back-button" onClick={goBackFromDetail}>
              ← Back to Projects
            </button>
            <h2>{currentProject.name} / {pinshots.find(p => p.id === selectedPinshot)?.name}</h2>
            <div className="detail-actions">
              <div className="share-actions">
                <button 
                  className="share-btn" 
                  onClick={generateShareLink}
                  disabled={isGeneratingLink}
                >
                  {isGeneratingLink ? 'Generating...' : 'Share'}
                </button>
                <button 
                  className="share-history-btn"
                  onClick={() => setShowShareHistory(!showShareHistory)}
                >
                  History
                </button>
                {showShareHistory && shareLinks.length > 0 && (
                  <div className="share-history-dropdown">
                    <h4>Recent Share Links</h4>
                    <ul>
                      {shareLinks
                        .filter(link => link.projectId === activeProject)
                        .map(link => (
                        <li key={link.id}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.url.split('//')[1]}
                          </a>
                          <span className="share-date">
                            {link.createdAt.toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </header>
          
          <div className="detail-content">
            <div 
              className="image-container" 
              ref={imageContainerRef}
              onClick={handleImageClick}
            >
              <img 
                src={currentProject.image || ''} 
                alt={currentProject.name} 
              />
              
              {/* Display pins */}
              {currentProject.pins.map(pin => (
                <div 
                  key={pin.id}
                  className="pin"
                  style={{ 
                    left: `${pin.x}%`, 
                    top: `${pin.y}%`,
                  }}
                  onClick={(e) => handlePinClick(e, pin.id)}
                >
                  <div 
                    className="pin-icon"
                    style={{ backgroundColor: pin.color || '#FF4D4F' }}
                  ></div>
                  {activePinId === pin.id && (
                    <div className="comment-bubble">
                      {pin.comment}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Pending pin with comment input */}
              {pendingPin && (
                <div 
                  className="pin pending"
                  style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="pin-icon"
                    style={{ backgroundColor: pinColor }}
                  ></div>
                  <div className="comment-input-container">
                    <textarea
                      placeholder="Add your comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <div className="comment-actions">
                      <button onClick={handleCommentSubmit}>Save</button>
                      <button onClick={handleCommentCancel}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="detail-sidebar">
              <div className="tools-section">
                <h4>Tools</h4>
                <div className="pin-color-selector">
                  <h5>Pin Color</h5>
                  <div className="color-options">
                    <button 
                      className={`color-option ${pinColor === '#FF4D4F' ? 'selected' : ''}`}
                      style={{ backgroundColor: '#FF4D4F' }}
                      onClick={() => setPinColor('#FF4D4F')}
                    ></button>
                    <button 
                      className={`color-option ${pinColor === '#4CAF50' ? 'selected' : ''}`}
                      style={{ backgroundColor: '#4CAF50' }}
                      onClick={() => setPinColor('#4CAF50')}
                    ></button>
                    <button 
                      className={`color-option ${pinColor === '#2196F3' ? 'selected' : ''}`}
                      style={{ backgroundColor: '#2196F3' }}
                      onClick={() => setPinColor('#2196F3')}
                    ></button>
                  </div>
                </div>
              </div>
              
              <div className="comments-section">
                <h4>Comments</h4>
                <div className="comments-count">{currentProject.pins.length} pins</div>
                
                {currentProject.pins.length > 0 ? (
                  <div className="comments-list">
                    {currentProject.pins.map(pin => (
                      <div key={pin.id} className="comment-item">
                        <div 
                          className="comment-pin-icon"
                          style={{ backgroundColor: pin.color || '#FF4D4F' }}
                        ></div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-title">Pin {pin.id.slice(-1)}</span>
                            <span className={`comment-status ${pin.status || 'pending'}`}>{pin.status || 'Pending'}</span>
                          </div>
                          <div className="comment-text">{pin.comment || 'No comments yet'}</div>
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
      ) : (
        <>
          {/* Sidebar */}
          <div className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
              <h1>PinShot</h1>
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                {showSidebar ? '←' : '→'}
              </button>
            </div>
            
            <div className="sidebar-content">
              <div className="sidebar-projects">
                {projects.map(project => (
                  <div 
                    key={project.id} 
                    className={`sidebar-project-item ${project.id === activeProject ? 'active' : ''}`}
                    onClick={() => setActiveProject(project.id)}
                  >
                    <span className="project-icon">📁</span>
                    <span>{project.name}</span>
                    <button 
                      className="project-menu-btn"
                      onClick={(e) => toggleProjectMenu(project.id, e)}
                    >
                      ⋮
                    </button>
                    {projectMenuOpen === project.id && (
                      <div className="project-menu">
                        <button onClick={() => handleDeleteProject(project.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="sidebar-project-item add" onClick={() => setShowCreateProject(true)}>
                  <span className="project-icon">+</span>
                  <span>Add Project</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {/* Header */}
            <header className="header">
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                {showSidebar ? '←' : '→'}
              </button>
              <button className="new-pinshot-btn" onClick={handleAddPinshot}>+ New PinShot</button>
              <div className="project-selector">
                <span className="selected-project">{currentProject.name}</span>
                <span className="dropdown-arrow">▼</span>
              </div>
            </header>
            
            {/* Project Content */}
            <div className="project-content">
              <div className="project-header">
                <div className="project-header-left">
                  <h2>{currentProject.name}</h2>
                  <p>Manage your visual feedback and screenshots</p>
                </div>
                <button className="upload-btn" onClick={handleAddPinshot}>
                  + Add A Pinshot
                </button>
              </div>

              <div className="project-actions">
                
                <div className="view-toggle">
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <span className="grid-icon">⊞</span>
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <span className="list-icon">≡</span>
                  </button>
                </div>
              </div>

              {/* Pinshots Display */}
              <div className={`pinshots-container ${viewMode}`}>
                {pinshots.length === 0 ? (
                  <div 
                    className="empty-state"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="empty-icon">📷</div>
                    <h3>No screenshots found</h3>
                    <p>Try adjusting your filter or add new screenshots</p>
                    <button className="upload-btn" onClick={handleAddPinshot}>
                      + Add A Pinshot
                    </button>
                  </div>
                ) : (
                  pinshots.map(pinshot => (
                    <div 
                      key={pinshot.id} 
                      className={`pinshot-item ${selectedPinshot === pinshot.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPinshot(pinshot.id);
                        setDetailView(true);
                      }}
                    >
                      <div className="pinshot-preview">
                        <img src={pinshot.image} alt={pinshot.name} />
                      </div>
                      <div className="pinshot-info">
                        <div className="pinshot-name">{pinshot.name}</div>
                        <div className={`pinshot-status ${pinshot.status}`}>{pinshot.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected Pinshot View */}
              {selectedPinshot && currentProject.image && (
                <div className="pinshot-detail">
                  <div className="pinshot-detail-header">
                    <h3>{pinshots.find(p => p.id === selectedPinshot)?.name}</h3>
                    <div className="pinshot-tools">
                      <div className="viewer-count">1 viewer</div>
                      <div className="share-actions">
                        <button 
                          className="share-btn" 
                          onClick={generateShareLink}
                          disabled={isGeneratingLink}
                        >
                          {isGeneratingLink ? 'Generating...' : 'Share'}
                        </button>
                        <button 
                          className="share-history-btn"
                          onClick={() => setShowShareHistory(!showShareHistory)}
                        >
                          History
                        </button>
                        {showShareHistory && shareLinks.length > 0 && (
                          <div className="share-history-dropdown">
                            <h4>Recent Share Links</h4>
                            <ul>
                              {shareLinks
                                .filter(link => link.projectId === activeProject)
                                .map(link => (
                                <li key={link.id}>
                                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                                    {link.url.split('//')[1]}
                                  </a>
                                  <span className="share-date">
                                    {link.createdAt.toLocaleDateString()}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pinshot-view">
                    <div 
                      className="image-container" 
                      ref={imageContainerRef}
                      onClick={handleImageClick}
                    >
                      <img 
                        src={currentProject.image} 
                        alt={currentProject.name} 
                      />
                      
                      {/* Display pins */}
                      {currentProject.pins.map(pin => (
                        <div 
                          key={pin.id}
                          className="pin"
                          style={{ 
                            left: `${pin.x}%`, 
                            top: `${pin.y}%`,
                          }}
                          onClick={(e) => handlePinClick(e, pin.id)}
                        >
                          <div 
                            className="pin-icon"
                            style={{ backgroundColor: pin.color || '#FF4D4F' }}
                          ></div>
                          {activePinId === pin.id && (
                            <div className="comment-bubble">
                              {pin.comment}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Pending pin with comment input */}
                      {pendingPin && (
                        <div 
                          className="pin pending"
                          style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div 
                            className="pin-icon"
                            style={{ backgroundColor: pinColor }}
                          ></div>
                          <div className="comment-input-container">
                            <textarea
                              placeholder="Add your comment..."
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                            <div className="comment-actions">
                              <button onClick={handleCommentSubmit}>Save</button>
                              <button onClick={handleCommentCancel}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="pinshot-sidebar">
                      <div className="tools-section">
                        <h4>Tools</h4>
                        <div className="pin-color-selector">
                          <h5>Pin Color</h5>
                          <div className="color-options">
                            <button 
                              className={`color-option ${pinColor === '#FF4D4F' ? 'selected' : ''}`}
                              style={{ backgroundColor: '#FF4D4F' }}
                              onClick={() => setPinColor('#FF4D4F')}
                            ></button>
                            <button 
                              className={`color-option ${pinColor === '#4CAF50' ? 'selected' : ''}`}
                              style={{ backgroundColor: '#4CAF50' }}
                              onClick={() => setPinColor('#4CAF50')}
                            ></button>
                            <button 
                              className={`color-option ${pinColor === '#2196F3' ? 'selected' : ''}`}
                              style={{ backgroundColor: '#2196F3' }}
                              onClick={() => setPinColor('#2196F3')}
                            ></button>
                          </div>
                        </div>
                        
                        <div className="zoom-controls">
                          <h5>Zoom</h5>
                          <div className="zoom-slider">
                            <button className="zoom-btn">-</button>
                            <div className="zoom-level">100%</div>
                            <button className="zoom-btn">+</button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="comments-section">
                        <h4>Comments</h4>
                        <div className="comments-count">{currentProject.pins.length} pins</div>
                        
                        {currentProject.pins.length > 0 ? (
                          <div className="comments-list">
                            {currentProject.pins.map(pin => (
                              <div key={pin.id} className="comment-item">
                                <div 
                                  className="comment-pin-icon"
                                  style={{ backgroundColor: pin.color || '#FF4D4F' }}
                                ></div>
                                <div className="comment-content">
                                  <div className="comment-header">
                                    <span className="comment-title">Pin {pin.id.slice(-1)}</span>
                                    <span className={`comment-status ${pin.status || 'pending'}`}>{pin.status || 'Pending'}</span>
                                  </div>
                                  <div className="comment-text">{pin.comment || 'No comments yet'}</div>
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
              )}
            </div>
          </div>

          {/* Create Project Modal */}
          {showCreateProject && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Create New Project</h2>
                <input 
                  type="text" 
                  placeholder="Project Name" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <div className="modal-actions">
                  <button onClick={() => setShowCreateProject(false)}>Cancel</button>
                  <button onClick={handleCreateProject}>Create</button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleImageUpload}
            accept="image/*"
          />
        </>
      )}
    </div>
  );
};

export default App;