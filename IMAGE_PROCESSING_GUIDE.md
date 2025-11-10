# Image Processing Guide

This guide explains how to use the image processing utilities to fix the "image exceeds 5 MB maximum" API error.

## Problem

When sending images to APIs (like Claude API), there's often a size limit (typically 5 MB). Large images cause errors like:

```
API Error: 400 {"type":"error","error":{"type":"invalid_request_error","message":"image exceeds 5 MB maximum: 10266168 bytes > 5242880 bytes"}}
```

## Solution

We've implemented automatic image compression and resizing utilities that ensure images stay under the size limit while maintaining acceptable quality.

## Features

- ✅ Automatic image compression
- ✅ Smart resizing while maintaining aspect ratio
- ✅ Base64 encoding with size validation
- ✅ Quality adjustment to meet size requirements
- ✅ Type-safe TypeScript implementation
- ✅ React hooks for easy integration
- ✅ Ready-to-use UI component

## Usage

### Option 1: Using the ImageUpload Component (Easiest)

```tsx
import ImageUpload from '@/components/common/ImageUpload/ImageUpload';

function MyComponent() {
  const handleImageProcessed = (data) => {
    console.log('Processed image:', {
      size: data.sizeInBytes,
      wasCompressed: data.wasCompressed,
      base64: data.base64, // Ready to send to API
    });

    // Send to API
    await sendToAPI({ image: data.base64 });
  };

  return (
    <ImageUpload
      onImageProcessed={handleImageProcessed}
      maxSizeBytes={5 * 1024 * 1024} // 5 MB
    />
  );
}
```

### Option 2: Using the Hook

```tsx
import { useImageProcessor } from '@/hooks/useImageProcessor';

function MyComponent() {
  const { processImage, processedImage, isProcessing, error } = useImageProcessor();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await processImage(file);

      if (processedImage) {
        // Image is now guaranteed to be under 5 MB
        await sendToAPI({ image: processedImage.base64 });
      }
    } catch (err) {
      console.error('Failed to process image:', err);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      {isProcessing && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      {processedImage && (
        <p>
          Size: {processedImage.sizeInBytes} bytes
          {processedImage.wasCompressed && ' (Compressed)'}
        </p>
      )}
    </div>
  );
}
```

### Option 3: Using Utility Functions Directly

```tsx
import { processImageFile, formatFileSize } from '@/app/utils/utils';

async function handleImage(file: File) {
  try {
    const result = await processImageFile(file, 5 * 1024 * 1024);

    console.log(`Original size: ${formatFileSize(file.size)}`);
    console.log(`Final size: ${formatFileSize(result.sizeInBytes)}`);
    console.log(`Compressed: ${result.wasCompressed ? 'Yes' : 'No'}`);

    // Use result.base64 for API calls
    return result.base64;
  } catch (error) {
    console.error('Image processing failed:', error);
    throw error;
  }
}
```

## Available Functions

### Core Functions

#### `processImageFile(file: File, maxSizeBytes?: number)`
Processes an image file to ensure it meets size requirements. Returns compressed data if needed.

**Returns:**
```typescript
{
  file: File;           // Processed file
  base64: string;       // Base64 encoded string
  sizeInBytes: number;  // Final size in bytes
  wasCompressed: boolean; // Whether compression was applied
}
```

#### `compressImage(file: File, maxSizeBytes?: number, maxWidth?: number, maxHeight?: number)`
Compresses and resizes an image. More control over dimensions.

**Returns:**
```typescript
{
  blob: Blob;          // Compressed image blob
  base64: string;      // Base64 encoded string
  sizeInBytes: number; // Final size in bytes
}
```

### Validation Functions

#### `isImageFile(file: File): boolean`
Checks if a file is an image.

#### `isImageSizeValid(sizeInBytes: number): boolean`
Checks if size is within the 5 MB limit.

#### `getBase64SizeInBytes(base64String: string): number`
Calculates the size of a base64 string in bytes.

### Utility Functions

#### `formatFileSize(bytes: number): string`
Formats bytes into human-readable format (e.g., "2.5 MB").

#### `calculateResizedDimensions(originalWidth, originalHeight, maxWidth, maxHeight)`
Calculates new dimensions while maintaining aspect ratio.

## Configuration

Default settings:
- **Maximum size:** 5 MB (5,242,880 bytes)
- **Maximum width:** 2048 pixels
- **Maximum height:** 2048 pixels
- **Initial quality:** 0.9
- **Minimum quality:** 0.3

These can be customized when calling the functions:

```typescript
await compressImage(
  file,
  3 * 1024 * 1024,  // 3 MB max size
  1920,              // Max width
  1080               // Max height
);
```

## How It Works

1. **Validation:** Checks if the file is an image
2. **Size Check:** If already under limit, returns original
3. **Resizing:** Reduces dimensions if needed (maintains aspect ratio)
4. **Compression:** Adjusts JPEG quality to meet size requirement
5. **Format Conversion:** Converts PNG to JPEG if needed for better compression
6. **Iteration:** Tries up to 10 quality levels to reach target size

## Error Handling

All functions throw descriptive errors:

```typescript
try {
  await processImageFile(file);
} catch (error) {
  if (error.message === 'File is not an image') {
    // Handle non-image file
  } else if (error.message === 'Failed to load image') {
    // Handle corrupted image
  }
}
```

## Integration with Existing Upload Flows

### Example: Updating UploadModal

```tsx
import { processImageFile } from '@/app/utils/utils';

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Add image processing before upload
  if (file.type.startsWith('image/')) {
    try {
      const processed = await processImageFile(file);
      setFile(processed.file); // Use compressed file

      if (processed.wasCompressed) {
        console.log('Image compressed to fit size limit');
      }
    } catch (error) {
      setError('Failed to process image');
      return;
    }
  }

  setFile(file);
};
```

## Performance Considerations

- **Processing time:** Typically 100-500ms for most images
- **Memory usage:** Temporary canvas created for compression
- **Browser compatibility:** Works in all modern browsers (uses Canvas API)

## Best Practices

1. **Always validate** image files before processing
2. **Show progress** indicators during compression
3. **Inform users** when images are compressed
4. **Handle errors** gracefully with user-friendly messages
5. **Test with large files** (>10 MB) to ensure compression works

## Testing

Test with various image sizes:

```typescript
// Test cases
const testImages = [
  { size: '500 KB', shouldCompress: false },
  { size: '3 MB', shouldCompress: false },
  { size: '10 MB', shouldCompress: true },
  { size: '50 MB', shouldCompress: true },
];

for (const test of testImages) {
  const result = await processImageFile(testImage);
  console.assert(result.sizeInBytes <= MAX_IMAGE_SIZE_BYTES);
}
```

## Support

For issues or questions:
1. Check the error message for specific failure reasons
2. Ensure the file is a valid image format (JPEG, PNG, GIF, WebP)
3. Verify browser compatibility (modern browsers required)

## Example Implementation

See `/src/components/common/ImageUpload/ImageUpload.tsx` for a complete working example.
