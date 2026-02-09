import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import prisma from '@/lib/prisma';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface SignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export interface UploadValidation {
  maxSizeMb: number;
  allowedMimes: string[];
}

/**
 * Get upload validation settings from admin settings
 */
export async function getUploadValidation(): Promise<UploadValidation> {
  const settings = await prisma.adminSettings.findUnique({
    where: { id: 'singleton' },
    select: { featureFlags: true },
  });
  
  const flags = settings?.featureFlags as { maxUploadSizeMb?: number; allowedMimes?: string[] } | null;
  
  return {
    maxSizeMb: flags?.maxUploadSizeMb || 5,
    allowedMimes: flags?.allowedMimes || ['image/jpeg', 'image/png', 'image/webp'],
  };
}

/**
 * Generate a unique key for the upload
 */
function generateKey(userId: string, filename: string): string {
  const ext = filename.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `uploads/${userId}/${timestamp}-${random}.${ext}`;
}

/**
 * Create a signed URL for uploading a file
 */
export async function createSignedUploadUrl(
  userId: string,
  filename: string,
  mime: string,
  size: number
): Promise<SignedUploadResult> {
  // Validate mime type and size
  const validation = await getUploadValidation();
  
  if (!validation.allowedMimes.includes(mime)) {
    throw new Error(`نوع الملف غير مسموح. الأنواع المسموحة: ${validation.allowedMimes.join(', ')}`);
  }
  
  const maxSizeBytes = validation.maxSizeMb * 1024 * 1024;
  if (size > maxSizeBytes) {
    throw new Error(`حجم الملف يتجاوز الحد المسموح (${validation.maxSizeMb}MB)`);
  }
  
  const key = generateKey(userId, filename);
  
  // Create upload session in database
  await prisma.uploadSession.create({
    data: {
      userId,
      key,
      mime,
      size,
      status: 'PENDING',
    },
  });
  
  // Generate signed URL
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: mime,
    ContentLength: size,
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;
  
  return { uploadUrl, key, publicUrl };
}

/**
 * Confirm that an upload has been completed
 */
export async function confirmUpload(userId: string, key: string): Promise<{ url: string }> {
  const session = await prisma.uploadSession.findFirst({
    where: {
      userId,
      key,
      status: 'PENDING',
    },
  });
  
  if (!session) {
    throw new Error('جلسة التحميل غير موجودة أو منتهية الصلاحية');
  }
  
  // Update session status
  await prisma.uploadSession.update({
    where: { id: session.id },
    data: { status: 'CONFIRMED' },
  });
  
  return { url: `${R2_PUBLIC_URL}/${key}` };
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  
  await s3Client.send(command);
  
  // Update session status if exists
  await prisma.uploadSession.updateMany({
    where: { key },
    data: { status: 'EXPIRED' },
  });
}

/**
 * Cleanup expired upload sessions (run as a scheduled job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  const expiredSessions = await prisma.uploadSession.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: expiryTime },
    },
  });
  
  // Delete files from R2
  for (const session of expiredSessions) {
    try {
      await deleteFile(session.key);
    } catch (error) {
      console.error(`Failed to delete expired file ${session.key}:`, error);
    }
  }
  
  // Update statuses
  const result = await prisma.uploadSession.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: expiryTime },
    },
    data: { status: 'EXPIRED' },
  });
  
  return result.count;
}

export default {
  createSignedUploadUrl,
  confirmUpload,
  deleteFile,
  cleanupExpiredSessions,
  getUploadValidation,
};
