import { supabase } from './supabase';
import type { ContentRow, ImageRow } from './types';

export async function fetchContent(): Promise<ContentRow[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContentRow[];
}

export async function fetchImages(): Promise<ImageRow[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ImageRow[];
}

export async function saveContent(
  row: Omit<ContentRow, 'id' | 'user_id' | 'created_at'>
): Promise<ContentRow> {
  const { data, error } = await supabase
    .from('content')
    .insert({
      type: row.type,
      title: row.title,
      prompt: row.prompt,
      result: row.result,
      language: row.language,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContentRow;
}

export async function saveImage(
  row: Omit<ImageRow, 'id' | 'user_id' | 'created_at'>
): Promise<ImageRow> {
  const { data, error } = await supabase
    .from('images')
    .insert({
      prompt: row.prompt,
      style: row.style,
      mood: row.mood,
      quality: row.quality,
      aspect_ratio: row.aspect_ratio,
      image_url: row.image_url,
      is_demo: row.is_demo,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ImageRow;
}

export async function deleteContent(id: string): Promise<void> {
  const { error } = await supabase.from('content').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteImage(id: string): Promise<void> {
  const { error } = await supabase.from('images').delete().eq('id', id);
  if (error) throw error;
}
