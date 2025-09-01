import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://czkcqkubpqxzfiejtuch.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6a2Nxa3VicHF4emZpZWp0dWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzU0MjcsImV4cCI6MjA3MjI1MTQyN30.Xl9dooUPNPEQeix0vUV0z4QH2R0tl0wl9vg-eG_e0ww';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Share link types
export interface ShareLink {
  id: string;
  short_id: string;
  url: string;
  project_id: string;
  created_at: string;
  expires_at: string | null;
}

// Function to create a share link
export async function createShareLink(projectId: string, expirationDays: number | null = null) {
  try {
    const { data, error } = await supabase
      .rpc('create_share_link', { 
        p_project_id: projectId,
        p_expiration_days: expirationDays
      });
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
}

// Function to get project by share link
export async function getProjectByShareLink(shortId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_project_by_share_link', { p_short_id: shortId });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting project by share link:', error);
    return null;
  }
}

// Function to get all share links for a project
export async function getShareLinks(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as ShareLink[];
  } catch (error) {
    console.error('Error getting share links:', error);
    return [];
  }
}

// Function to check if a share link is valid
export async function isShareLinkValid(shortId: string) {
  try {
    const { data, error } = await supabase
      .from('share_links')
      .select('id')
      .eq('short_id', shortId)
      .is('expires_at', null)
      .or(`expires_at.gt.${new Date().toISOString()}`)
      .single();
    
    if (error) return false;
    return !!data;
  } catch (error) {
    console.error('Error checking share link validity:', error);
    return false;
  }
}
