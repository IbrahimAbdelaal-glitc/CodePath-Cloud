import { z } from 'zod';

export const uuid = z.uuid('Invalid identifier');

export const idParams = z.object({ id: uuid });

export const difficulty = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
  error: 'Invalid difficulty level',
});

export const httpUrl = z
  .string()
  .trim()
  .url('Invalid URL')
  .refine((u) => /^https?:\/\//i.test(u), 'The URL must start with http or https');

export const slug = z
  .string()
  .trim()
  .min(2, 'The slug is too short')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'The slug may only contain lowercase English letters, digits and hyphens');

export const topicTag = z
  .string()
  .trim()
  .min(2, 'The topic tag is too short')
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'The topic tag may only contain lowercase English letters, digits and hyphens');
