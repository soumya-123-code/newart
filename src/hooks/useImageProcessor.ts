import { useState, useCallback } from 'react';
import {
  processImageFile,
  isImageFile,
  formatFileSize,
  MAX_IMAGE_SIZE_BYTES,
} from '@/app/utils/utils';

interface ImageProcessorState {
  isProcessing: boolean;
  error: string | null;
  processedImage: {
    file: File;
    base64: string;
    sizeInBytes: number;
    wasCompressed: boolean;
  } | null;
}

interface UseImageProcessorReturn extends ImageProcessorState {
  processImage: (file: File, maxSizeBytes?: number) => Promise<void>;
  reset: () => void;
  getFormattedSize: () => string;
}

/**
 * Custom hook for processing and compressing images
 * Ensures images stay under the specified size limit (default: 5 MB)
 *
 * @param maxSizeBytes - Maximum allowed size in bytes (default: 5 MB)
 * @returns Image processor state and functions
 *
 * @example
 * ```tsx
 * const { processImage, processedImage, isProcessing, error } = useImageProcessor();
 *
 * const handleFileSelect = async (file: File) => {
 *   await processImage(file);
 *   if (processedImage) {
 *     // Use processedImage.base64 for API calls
 *     // Use processedImage.file for uploads
 *   }
 * };
 * ```
 */
export function useImageProcessor(
  defaultMaxSize: number = MAX_IMAGE_SIZE_BYTES
): UseImageProcessorReturn {
  const [state, setState] = useState<ImageProcessorState>({
    isProcessing: false,
    error: null,
    processedImage: null,
  });

  const processImage = useCallback(
    async (file: File, maxSizeBytes: number = defaultMaxSize) => {
      // Reset state
      setState({
        isProcessing: true,
        error: null,
        processedImage: null,
      });

      try {
        // Validate file type
        if (!isImageFile(file)) {
          throw new Error('Selected file is not an image. Please select a valid image file.');
        }

        // Process the image
        const result = await processImageFile(file, maxSizeBytes);

        // Update state with processed image
        setState({
          isProcessing: false,
          error: null,
          processedImage: result,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
        setState({
          isProcessing: false,
          error: errorMessage,
          processedImage: null,
        });
        throw err;
      }
    },
    [defaultMaxSize]
  );

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      processedImage: null,
    });
  }, []);

  const getFormattedSize = useCallback(() => {
    if (!state.processedImage) return '';
    return formatFileSize(state.processedImage.sizeInBytes);
  }, [state.processedImage]);

  return {
    ...state,
    processImage,
    reset,
    getFormattedSize,
  };
}
