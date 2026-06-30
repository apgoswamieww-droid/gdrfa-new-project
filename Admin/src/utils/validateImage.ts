export interface ImageValidationResult {
  valid: boolean;
  error: string;
}

export interface ValidateImageOptions {
  minAspectRatio?: number;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

/**
 * Validates an image file by reading its actual dimensions via the native Image API.
 * Returns `{ valid, error }` — no state mutations, no side effects.
 * Caller is responsible for revoking the object URL after use.
 */
export function validateImageDimensions(
  file: File,
  options: ValidateImageOptions = {},
): Promise<ImageValidationResult> {
  const {
    minAspectRatio = 16 / 9,
    allowedTypes,
    maxSizeMB,
  } = options;

  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ valid: false, error: "Only image files are allowed." });
      return;
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: `Allowed formats: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}.`,
      });
      return;
    }

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      resolve({
        valid: false,
        error: `File size must be under ${maxSizeMB}MB.`,
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = img.width / img.height;

      if (ratio < minAspectRatio) {
        resolve({
          valid: false,
          error: `Image must be wide angle (minimum ${minAspectRatio.toFixed(2)}:1 ratio required). Uploaded image is ${img.width}×${img.height}px (${ratio.toFixed(2)}:1). Accepted examples: 1920×1080, 1280×720, 1600×900, 2560×1440.`,
        });
        return;
      }

      resolve({ valid: true, error: "" });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: "Failed to load image. Please try another file." });
    };

    img.src = url;
  });
}
