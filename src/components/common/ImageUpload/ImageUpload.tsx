'use client';

import React, { useRef, useState } from 'react';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { MAX_IMAGE_SIZE_BYTES, formatFileSize } from '@/app/utils/utils';
import styles from './ImageUpload.module.scss';

interface ImageUploadProps {
  onImageProcessed?: (data: {
    file: File;
    base64: string;
    sizeInBytes: number;
    wasCompressed: boolean;
  }) => void;
  maxSizeBytes?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * ImageUpload component with automatic compression
 * Ensures images stay under the specified size limit before upload
 *
 * @example
 * ```tsx
 * <ImageUpload
 *   onImageProcessed={(data) => {
 *     // Send data.base64 to API
 *     console.log('Image size:', formatFileSize(data.sizeInBytes));
 *   }}
 *   maxSizeBytes={5 * 1024 * 1024} // 5 MB
 * />
 * ```
 */
const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageProcessed,
  maxSizeBytes = MAX_IMAGE_SIZE_BYTES,
  accept = 'image/*',
  className = '',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { processImage, processedImage, isProcessing, error, reset } = useImageProcessor(maxSizeBytes);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await processImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing image:', err);
    }
  };

  const handleRemove = () => {
    reset();
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (processedImage && onImageProcessed) {
      onImageProcessed(processedImage);
    }
  };

  return (
    <div className={`${styles.imageUpload} ${className}`}>
      {!preview && (
        <div className={styles.uploadArea}>
          <label htmlFor="imageInput" className={styles.uploadLabel}>
            <div className={styles.uploadIcon}>📷</div>
            <p className={styles.uploadText}>
              Click to select an image or drag and drop
            </p>
            <p className={styles.uploadSubtext}>
              Maximum size: {formatFileSize(maxSizeBytes)}
            </p>
          </label>
          <input
            id="imageInput"
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isProcessing}
            className={styles.fileInput}
          />
        </div>
      )}

      {isProcessing && (
        <div className={styles.processing}>
          <div className={styles.spinner} />
          <p>Processing image...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>❌ {error}</p>
          <button onClick={handleRemove} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {preview && processedImage && (
        <div className={styles.preview}>
          <img src={preview} alt="Preview" className={styles.previewImage} />
          <div className={styles.imageInfo}>
            <p className={styles.infoText}>
              Size: {formatFileSize(processedImage.sizeInBytes)}
            </p>
            {processedImage.wasCompressed && (
              <p className={styles.compressedBadge}>
                ✓ Compressed
              </p>
            )}
          </div>
          <div className={styles.actions}>
            <button
              onClick={handleRemove}
              className={styles.removeButton}
              disabled={disabled}
            >
              Remove
            </button>
            <button
              onClick={handleUpload}
              className={styles.uploadButton}
              disabled={disabled}
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
