import { getServiceRoleClient } from './db';
import fs from 'fs';
import path from 'path';

const BUCKET_NAME = 'tickets_vault';
const LOCAL_VAULT_DIR = path.join(process.cwd(), 'public', 'vault');

// Ensure local vault dir exists for fallback
if (!fs.existsSync(LOCAL_VAULT_DIR)) {
  try {
    fs.mkdirSync(LOCAL_VAULT_DIR, { recursive: true });
  } catch (e) {
    // Ignore error in edge runtime
  }
}

/**
 * Uploads an uploaded ticket file to private storage bucket.
 * Key path format: `${userId}/${Date.now()}_${sanitizedFileName}`
 */
export async function uploadTicketFile({
  fileBuffer,
  fileName,
  mimeType,
  userId,
}: {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
}): Promise<{ filePath: string; storageType: 'supabase' | 'local' }> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${Date.now()}_${sanitizedName}`;

  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (!error && data) {
      return { filePath: data.path, storageType: 'supabase' };
    }
    console.warn('Supabase storage upload error, falling back to local vault:', error?.message);
  } catch (err: any) {
    console.warn('Supabase storage not accessible, falling back to local vault:', err?.message);
  }

  // Fallback to local secure vault in public/vault
  const userVaultDir = path.join(LOCAL_VAULT_DIR, userId);
  if (!fs.existsSync(userVaultDir)) {
    fs.mkdirSync(userVaultDir, { recursive: true });
  }
  const localFileName = `${Date.now()}_${sanitizedName}`;
  const fullPath = path.join(userVaultDir, localFileName);
  fs.writeFileSync(fullPath, fileBuffer);

  return {
    filePath: `local://${userId}/${localFileName}`,
    storageType: 'local',
  };
}

/**
 * Retrieves a short-lived signed URL (5-minute expiry = 300 seconds) for viewing
 */
export async function getSignedFileUrl(filePath: string): Promise<string> {
  if (filePath.startsWith('local://')) {
    const relativePath = filePath.replace('local://', '');
    return `/vault/${relativePath}`;
  }

  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 300); // 5 minutes

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.error('Error generating signed URL:', err);
  }

  return `/api/tickets/file?path=${encodeURIComponent(filePath)}`;
}

/**
 * Deletes a file from storage
 */
export async function deleteTicketFile(filePath: string): Promise<boolean> {
  if (filePath.startsWith('local://')) {
    try {
      const rel = filePath.replace('local://', '');
      const full = path.join(LOCAL_VAULT_DIR, rel);
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
      }
      return true;
    } catch {
      return false;
    }
  }

  try {
    const supabase = getServiceRoleClient();
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    return !error;
  } catch {
    return false;
  }
}
