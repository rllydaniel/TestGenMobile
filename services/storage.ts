import { SupabaseClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';

export async function uploadNotes(
  supabase: SupabaseClient,
  fileUri: string,
  fileName: string
): Promise<string> {
  const fileData = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64' as any,
  });

  const filePath = `notes/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from('notes')
    .upload(filePath, decode(fileData), {
      contentType: getMimeType(fileName),
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('notes')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
