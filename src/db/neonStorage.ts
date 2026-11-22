import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Neon Object Storage Client
 * Bucket: my-bucket
 * Strictly server-side: credentials are never leaked to client bundles.
 */

const bucketName = process.env.NEON_STORAGE_BUCKET || 'my-bucket';
const endpoint = process.env.NEON_STORAGE_ENDPOINT;
const accessKeyId = process.env.NEON_STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.NEON_STORAGE_SECRET_ACCESS_KEY;
const region = process.env.NEON_STORAGE_REGION || 'us-east-1';

export const isStorageConfigured = Boolean(endpoint && accessKeyId && secretAccessKey);

let s3ClientInstance: S3Client | null = null;
function getS3Client(): S3Client | null {
  if (!isStorageConfigured) return null;
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
      forcePathStyle: true,
    });
  }
  return s3ClientInstance;
}

/**
 * Generates a presigned URL for secure client uploads to Neon Object Storage `my-bucket`
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 300
): Promise<{ uploadUrl: string; fileKey: string; bucket: string } | null> {
  const client = getS3Client();
  if (!client) {
    // Graceful fallback for local development: return direct upload endpoint or simulate
    return {
      uploadUrl: `/api/storage/local-upload?key=${encodeURIComponent(key)}`,
      fileKey: key,
      bucket: bucketName,
    };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    return {
      uploadUrl,
      fileKey: key,
      bucket: bucketName,
    };
  } catch (err) {
    console.error('[Neon Storage] Failed to generate presigned upload URL:', err);
    return null;
  }
}

/**
 * Generates a short-lived presigned URL for private document/voucher download
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresInSeconds: number = 900
): Promise<string | null> {
  const client = getS3Client();
  if (!client) {
    return `/api/storage/local-download?key=${encodeURIComponent(key)}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error('[Neon Storage] Failed to generate download URL:', err);
    return null;
  }
}
