/**
 * File path: /lib/image-upload.ts
 * Purpose: Utility functions for handling image uploads and storage
 */

import fs from 'fs';
import path from 'path';

/**
 * Saves a base64 image to the filesystem and returns the public URL path
 * @param base64Data - The base64 encoded image data (with or without data URI prefix)
 * @param filename - The desired filename (will be sanitized)
 * @param subfolder - Optional subfolder within uploads (e.g., 'avatars', 'clients')
 * @returns The public URL path to the saved image (e.g., '/uploads/avatars/filename.png')
 */
export function saveBase64Image(
  base64Data: string,
  filename: string,
  subfolder: string = 'avatars'
): string {
  // Remove data URI prefix if present (e.g., "data:image/png;base64,")
  const base64String = base64Data.includes(',')
    ? base64Data.split(',')[1]
    : base64Data;

  // Extract image format from data URI or default to png
  let extension = 'png';
  if (base64Data.includes('data:image/')) {
    const match = base64Data.match(/data:image\/(\w+);base64/);
    if (match) {
      extension = match[1];
    }
  }

  // Sanitize filename and add timestamp to avoid collisions
  const sanitizedFilename = filename
    .replace(/[^a-z0-9_-]/gi, '_')
    .toLowerCase();
  const timestamp = Date.now();
  const finalFilename = `${sanitizedFilename}_${timestamp}.${extension}`;

  // Define paths
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
  const filePath = path.join(uploadsDir, finalFilename);
  const publicPath = `/uploads/${subfolder}/${finalFilename}`;

  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Convert base64 to buffer and save
  const imageBuffer = Buffer.from(base64String, 'base64');
  fs.writeFileSync(filePath, imageBuffer);

  return publicPath;
}

/**
 * Deletes an image file from the filesystem
 * @param publicPath - The public URL path to the image (e.g., '/uploads/avatars/filename.png')
 * @returns true if file was deleted, false if file didn't exist
 */
export function deleteImage(publicPath: string): boolean {
  try {
    // Convert public path to filesystem path
    const filePath = path.join(process.cwd(), 'public', publicPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error deleting image:', err);
    return false;
  }
}

/**
 * Checks if a string is a base64 image data URI
 * @param str - The string to check
 * @returns true if the string is a base64 data URI
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/');
}

/**
 * Sanitizes avatar URL - replaces base64 with default avatar
 * @param avatarUrl - The avatar URL to sanitize
 * @param defaultAvatar - The default avatar path (default: '/default_profile.png')
 * @returns Sanitized avatar URL (file path or default)
 */
export function sanitizeAvatarUrl(
  avatarUrl: string | undefined | null,
  defaultAvatar: string = '/default_profile.png'
): string {
  if (!avatarUrl) return defaultAvatar;

  // If it's a base64 image, replace with default to avoid slow responses
  if (isBase64Image(avatarUrl)) {
    return defaultAvatar;
  }

  return avatarUrl;
}
