import { v2 as cloudinary } from 'cloudinary';

import { env } from './env.js';

function hasAllCloudinaryValues() {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export function isCloudinaryConfigured() {
  return hasAllCloudinaryValues();
}

export function getCloudinaryClient() {
  if (!hasAllCloudinaryValues()) {
    return undefined;
  }

  cloudinary.config({
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    cloud_name: env.cloudinaryCloudName,
    secure: true,
  });

  return cloudinary;
}
