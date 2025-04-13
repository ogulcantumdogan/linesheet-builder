/**
 * Utility functions for handling images:
 * - Compressing images to reduce size
 * - Converting to/from Base64 for Firestore storage
 */

/**
 * Compresses an image and converts it to a Base64 string
 * Limits image to 600px in the largest dimension
 * Target size around 500KB
 */
export async function compressAndEncodeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a FileReader to read the file
    const reader = new FileReader();
    
    reader.onload = (event) => {
      // Create an image to get the dimensions
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions, maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 600;
        
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        
        // Create a canvas to draw the resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw the resized image on the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get the compressed image as a Base64 string
        // Adjust quality parameter to target ~500KB
        const quality = 0.7; // Adjust this value to control quality vs size
        const base64String = canvas.toDataURL('image/jpeg', quality);
        
        resolve(base64String);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the image source to the file data
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a base64 string is too large for Firestore (>1MB)
 */
export function isBase64TooLarge(base64String: string): boolean {
  // Estimate size: Base64 uses ~4 chars per 3 bytes
  const estimatedSizeInBytes = Math.ceil((base64String.length * 3) / 4);
  return estimatedSizeInBytes > 1000000; // 1MB limit
}

/**
 * Create an object URL from a Base64 string
 * For displaying images from Firestore in the UI
 */
export function base64ToObjectUrl(base64String: string): string {
  // Skip if the string is already a URL
  if (base64String.startsWith('data:image') || base64String.startsWith('blob:')) {
    return base64String;
  }
  
  // Convert Base64 to Blob
  const byteString = atob(base64String.split(',')[1]);
  const mimeString = base64String.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([ab], { type: mimeString });
  return URL.createObjectURL(blob);
} 