import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { uploadImage, getPublicUrl, createSharedImage } from '../lib/supabase';
import './ImageShare.css';

export default function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select an image to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      
      // Upload to Supabase Storage
      await uploadImage(file, filePath);
      
      // Get the public URL
      const publicUrl = getPublicUrl(filePath);
      
      // Create shared image record
      const imageData = await createSharedImage(
        title || 'Untitled Image',
        description || '',
        publicUrl,
        filePath
      );
      
      toast.success('Image uploaded successfully!');
      
      // Navigate to the view page
      navigate(`/view/${imageData[0].short_id}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload and Share an Image</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter a title for your image"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Describe your image"
          />
        </div>
        <div className="form-group file-input-group">
          <label htmlFor="image" className="file-input-label">
            {file ? 'Change Image' : 'Select Image'}
          </label>
          <input
            type="file"
            id="image"
            className="file-input"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          {file && <p>{file.name}</p>}
        </div>
        {previewUrl && (
          <div className="image-preview">
            <img
              src={previewUrl}
              alt="Preview"
            />
          </div>
        )}
        <button 
          type="submit" 
          className="submit-button" 
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload and Share'}
        </button>
      </form>
    </div>
  );
}
