import { JSX } from "react";
import { HiMiniEquals } from "react-icons/hi2";
import {
  MdOutlineKeyboardDoubleArrowUp,
  MdOutlineKeyboardDoubleArrowDown,
} from "react-icons/md";

export const getStatusColorCode = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "review":
      return "warning";
    case "completed":
      return "success";
    case "prepare":
      return "info";
    case "ready":
      return "info";
    case "failed":
      return "danger";
    default:
      return "primary";
  }
};

export const getPriorityColorCode = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "muted";
    default:
      return "primary";
  }
};

export const getDateInFormat = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = date.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const day = date.getUTCDate();
  return `${day} ${month} ${year}`;
};

export function formatNumber(num: number | string): string {
  if (num === null || num === undefined || num === '') return '0.00';
  
  const n = Number(num);
  if (isNaN(n)) return String(num);
  
  const absValue = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return n < 0 ? `(${absValue})` : absValue;
}



export const getPriorityIcon = (
  priority: string,
  color: string
): JSX.Element | null => {
  const priorityLower = priority.toLowerCase();

  if (priorityLower === "high" ) {
    return <MdOutlineKeyboardDoubleArrowUp color={color} size={20} />;
  } else if (priorityLower === "medium") {
    return <HiMiniEquals color={color} size={20} />;
  } else if (priorityLower === "low" ) {
    return <MdOutlineKeyboardDoubleArrowDown color={color} size={20} />;
  }

  return null;
};

// ===================================
// Image Processing Utilities
// ===================================

/**
 * Maximum allowed image size in bytes (5 MB)
 */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Validates if an image size is within the allowed limit
 */
export function isImageSizeValid(sizeInBytes: number): boolean {
  return sizeInBytes <= MAX_IMAGE_SIZE_BYTES;
}

/**
 * Calculates the size of a base64 string in bytes
 */
export function getBase64SizeInBytes(base64String: string): number {
  // Remove data URL prefix if present
  const base64Data = base64String.split(',')[1] || base64String;

  // Calculate size: (base64 length * 3/4) - padding
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return (base64Data.length * 3) / 4 - padding;
}

/**
 * Loads an image from a File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Converts a canvas to a blob with specified quality
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Converts a blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Resizes an image to fit within max dimensions while maintaining aspect ratio
 */
export function calculateResizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Resize if dimensions exceed max
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height),
  };
}

/**
 * Compresses and resizes an image to ensure it stays under the size limit
 */
export async function compressImage(
  file: File,
  maxSizeBytes: number = MAX_IMAGE_SIZE_BYTES,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): Promise<{ blob: Blob; base64: string; sizeInBytes: number }> {
  if (!isImageFile(file)) {
    throw new Error('File is not an image');
  }

  // Load the image
  const img = await loadImage(file);

  // Calculate new dimensions
  const { width, height } = calculateResizedDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  );

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Determine mime type (prefer JPEG for better compression)
  const mimeType = file.type === 'image/png' && file.size > maxSizeBytes
    ? 'image/jpeg'
    : file.type;

  // Try different quality levels to get under size limit
  let quality = 0.9;
  let blob: Blob;
  let base64: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    blob = await canvasToBlob(canvas, mimeType, quality);
    base64 = await blobToBase64(blob);
    const size = getBase64SizeInBytes(base64);

    if (size <= maxSizeBytes) {
      return {
        blob,
        base64,
        sizeInBytes: size,
      };
    }

    // Reduce quality for next attempt
    quality -= 0.1;
    attempts++;

    // If quality is too low, try reducing dimensions further
    if (quality < 0.3 && attempts < maxAttempts) {
      const scaleFactor = 0.8;
      canvas.width = Math.floor(canvas.width * scaleFactor);
      canvas.height = Math.floor(canvas.height * scaleFactor);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      quality = 0.9; // Reset quality for new size
    }
  } while (attempts < maxAttempts);

  // If we still can't get it under the limit, return the smallest we achieved
  const finalBase64 = await blobToBase64(blob);
  return {
    blob,
    base64: finalBase64,
    sizeInBytes: getBase64SizeInBytes(finalBase64),
  };
}

/**
 * Processes an image file to ensure it meets size requirements
 * Returns the compressed image data or the original if already compliant
 */
export async function processImageFile(
  file: File,
  maxSizeBytes: number = MAX_IMAGE_SIZE_BYTES
): Promise<{ file: File; base64: string; sizeInBytes: number; wasCompressed: boolean }> {
  if (!isImageFile(file)) {
    throw new Error('File is not an image');
  }

  // Check if original file is already under limit
  if (file.size <= maxSizeBytes) {
    const base64 = await blobToBase64(file);
    const size = getBase64SizeInBytes(base64);

    if (size <= maxSizeBytes) {
      return {
        file,
        base64,
        sizeInBytes: size,
        wasCompressed: false,
      };
    }
  }

  // Compress the image
  const { blob, base64, sizeInBytes } = await compressImage(file, maxSizeBytes);

  // Create a new File object from the compressed blob
  const compressedFile = new File([blob], file.name, {
    type: blob.type,
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    base64,
    sizeInBytes,
    wasCompressed: true,
  };
}

/**
 * Validates and formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
