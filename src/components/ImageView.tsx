import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { SharedImage } from '../lib/supabase';
import { getImageWithComments, addComment } from '../lib/supabase';
import './ImageShare.css';

export default function ImageView() {
  const { id } = useParams<{ id: string }>();
  const [image, setImage] = useState<SharedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getImageWithComments(id);
        
        if (!data) {
          setError('Image not found');
          return;
        }
        
        setImage(data);
      } catch (err) {
        console.error('Error fetching image:', err);
        setError('Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !image) {
      toast.error('Please enter a comment');
      return;
    }
    
    try {
      setSubmitting(true);
      await addComment(image.id, comment, authorName || undefined);
      
      // Refresh image data to get updated comments
      const updatedData = await getImageWithComments(id!);
      setImage(updatedData);
      
      // Clear form
      setComment('');
      toast.success('Comment added successfully!');
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading image...</p>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Failed to load image'}</p>
        <Link to="/upload" className="back-link">Go to Upload</Link>
      </div>
    );
  }

  return (
    <div className="image-view-container">
      <div className="image-header">
        <h1>{image.title || 'Shared Image'}</h1>
        {image.description && <p className="image-description">{image.description}</p>}
      </div>
      
      <div className="image-display">
        <img src={image.image_url} alt={image.title || 'Shared image'} />
      </div>
      
      <div className="share-section">
        <h3>Share this image</h3>
        <div className="share-url">
          <input 
            type="text" 
            readOnly 
            value={window.location.href} 
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard!');
            }}
          >
            Copy Link
          </button>
        </div>
      </div>
      
      <div className="comments-section">
        <h3>Comments</h3>
        
        <form onSubmit={handleSubmitComment} className="comment-form upload-form">
          <div className="form-group">
            <label htmlFor="authorName">Your Name (optional)</label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Anonymous"
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="comment">Comment</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comment..."
              className="form-textarea"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
        
        <div className="comments-list">
          {image.comments && image.comments.length > 0 ? (
            image.comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">{comment.author_name}</span>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))
          ) : (
            <p className="no-comments">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
}
