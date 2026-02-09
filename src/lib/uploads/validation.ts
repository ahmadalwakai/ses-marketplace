// File upload validation utilities

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSIONS = { width: 4096, height: 4096 };

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileType(
  mimeType: string, 
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES
): FileValidationResult {
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `نوع الملف غير مدعوم. الأنواع المسموحة: ${allowedTypes.join(', ')}`,
    };
  }
  return { valid: true };
}

export function validateFileSize(
  size: number, 
  maxSize: number = MAX_FILE_SIZE
): FileValidationResult {
  if (size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB}MB`,
    };
  }
  return { valid: true };
}

export function validateFileName(name: string): FileValidationResult {
  // Check for potentially dangerous file names
  const dangerousPatterns = [
    /\.\./,  // Path traversal
    /[<>:"|?*]/,  // Invalid characters
    /^\./,  // Hidden files
    /\.(exe|bat|cmd|sh|php|asp|jsp)$/i,  // Executable extensions
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(name)) {
      return {
        valid: false,
        error: 'اسم الملف يحتوي على أحرف غير مسموحة',
      };
    }
  }

  if (name.length > 255) {
    return {
      valid: false,
      error: 'اسم الملف طويل جداً',
    };
  }

  return { valid: true };
}

export function validateUpload(
  file: { name: string; size: number; type: string },
  options: {
    allowedTypes?: string[];
    maxSize?: number;
  } = {}
): FileValidationResult {
  const { allowedTypes = ALLOWED_IMAGE_TYPES, maxSize = MAX_FILE_SIZE } = options;

  // Validate file name
  const nameResult = validateFileName(file.name);
  if (!nameResult.valid) return nameResult;

  // Validate file type
  const typeResult = validateFileType(file.type, allowedTypes);
  if (!typeResult.valid) return typeResult;

  // Validate file size
  const sizeResult = validateFileSize(file.size, maxSize);
  if (!sizeResult.valid) return sizeResult;

  return { valid: true };
}

// Generate safe file name
export function sanitizeFileName(name: string): string {
  // Remove directory path if present
  const fileName = name.split(/[/\\]/).pop() || name;
  
  // Get extension
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  
  // Sanitize base name
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_')  // Keep alphanumeric, Arabic, underscore, hyphen
    .replace(/_+/g, '_')  // Collapse multiple underscores
    .replace(/^_|_$/g, '')  // Trim underscores
    .slice(0, 100);  // Limit length
  
  // Generate unique suffix
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${sanitized || 'file'}_${timestamp}_${random}.${ext}`;
}

// MIME type to extension mapping
export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export function getExtensionFromMime(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType.toLowerCase()] || 'bin';
}
