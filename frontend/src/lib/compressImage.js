const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const TARGET_QUALITY = 0.7;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB raw input limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Compress an image file in the browser.
 * Returns a Blob (JPEG) that is ≤~500 KB and ≤1200px wide.
 */
export async function compressImage(file) {
  if (!file || !file.type) throw new Error('No file provided.');

  const type = file.type.toLowerCase();
  if (!ALLOWED_TYPES.some((t) => type.includes(t.split('/')[1]))) {
    throw new Error(`Unsupported image type: ${file.type}. Use JPEG, PNG, or WebP.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode the image.'));
      img.onload = () => {
        let { width, height } = img;

        // Scale down if larger than max dimensions
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed.'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          TARGET_QUALITY
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
