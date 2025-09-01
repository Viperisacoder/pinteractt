import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for image sharing
export const uploadImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('image_uploads')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return data;
};

export const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from('image_uploads').getPublicUrl(path);
  return data.publicUrl;
};

// Image sharing API
export const createSharedImage = async (
  title: string,
  description: string,
  imageUrl: string,
  storagePath: string
) => {
  const { data, error } = await supabase.rpc('create_shared_image', {
    p_title: title,
    p_description: description,
    p_image_url: imageUrl,
    p_storage_path: storagePath,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const getImageWithComments = async (shortId: string) => {
  const { data, error } = await supabase.rpc('get_image_with_comments', {
    p_short_id: shortId,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const addComment = async (imageId: string, content: string, authorName?: string) => {
  const { data, error } = await supabase
    .from('image_comments')
    .insert([
      {
        image_id: imageId,
        content,
        author_name: authorName || 'Anonymous',
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data;
};

// Types
export interface SharedImage {
  id: string;
  title: string;
  description: string;
  image_url: string;
  short_id: string;
  created_at: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
}
