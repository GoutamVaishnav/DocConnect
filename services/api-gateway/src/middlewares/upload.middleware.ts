import multer from 'multer';

export const maxConsultationImageBytes = 10 * 1024 * 1024;

// Memory storage lets the gateway pass the authenticated upload directly to
// Cloudinary without writing sensitive patient images to the local disk.
export const consultationImageUpload = multer({
  limits: { fileSize: maxConsultationImageBytes, files: 1 },
  storage: multer.memoryStorage(),
}).single('image');
