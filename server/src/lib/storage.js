// Object storage for uploaded lesson videos. Any S3-compatible service works; production uses Neon Object Storage.
// Browsers upload straight to the bucket with a short-lived presigned PUT URL and play videos through presigned GET
// URLs, so video bytes never pass through (or are stored on) the API server. The bucket stays private.
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';
import { HttpError } from './errors.js';

const { storage } = config;

export const storageConfigured = Boolean(storage.endpoint && storage.accessKeyId && storage.secretAccessKey);

const client = storageConfigured
  ? new S3Client({
      endpoint: storage.endpoint,
      region: storage.region,
      forcePathStyle: storage.forcePathStyle,
      credentials: { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey },
      // Presigned PUT URLs must not embed a checksum of an empty body
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
  : null;

export const UPLOAD_URL_SECONDS = 60 * 60;
export const PLAYBACK_URL_SECONDS = 6 * 60 * 60;

function requireStorage() {
  if (!client) {
    throw new HttpError(503, 'Video storage is not configured on the server yet. Ask an administrator to set the storage credentials.', {
      code: 'STORAGE_NOT_CONFIGURED',
    });
  }
  return client;
}

// Creates the bucket on first use and lets the web app's origins upload to it from the browser
let bucketReady = null;
export function ensureBucket() {
  const s3 = requireStorage();
  bucketReady ??= (async () => {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: storage.bucket }));
    } catch (err) {
      if (err?.$metadata?.httpStatusCode !== 404 && err?.name !== 'NotFound') throw err;
      await s3.send(new CreateBucketCommand({ Bucket: storage.bucket }));
    }
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: storage.bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: config.corsOrigins,
              AllowedMethods: ['PUT', 'GET', 'HEAD'],
              AllowedHeaders: ['content-type', 'content-length'],
              ExposeHeaders: ['ETag', 'Content-Length', 'Content-Range', 'Accept-Ranges'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    );
  })().catch((err) => {
    bucketReady = null;
    throw err;
  });
  return bucketReady;
}

// The signature covers the content type and exact length, so the browser cannot upload a different file
export async function presignUpload({ key, contentType, sizeBytes }) {
  const s3 = requireStorage();
  await ensureBucket();
  const command = new PutObjectCommand({ Bucket: storage.bucket, Key: key, ContentType: contentType, ContentLength: sizeBytes });
  return getSignedUrl(s3, command, { expiresIn: UPLOAD_URL_SECONDS, signableHeaders: new Set(['content-type', 'content-length']) });
}

export async function presignPlayback(key) {
  const s3 = requireStorage();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: storage.bucket, Key: key }), { expiresIn: PLAYBACK_URL_SECONDS });
}

// Returns { sizeBytes, contentType } or null when the object does not exist
export async function headObject(key) {
  const s3 = requireStorage();
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: key }));
    return { sizeBytes: Number(head.ContentLength), contentType: head.ContentType };
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return null;
    throw err;
  }
}

export async function deleteObject(key) {
  if (!client) return;
  await client.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: key }));
}
