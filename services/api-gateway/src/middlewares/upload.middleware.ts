import multer from 'multer';

export const maxConsultationImageBytes = 10 * 1024 * 1024;
export const maxChatAttachmentBytes = 10 * 1024 * 1024;

// Memory storage lets the gateway pass the authenticated upload directly to
// Cloudinary without writing sensitive patient images to the local disk.
export const consultationImageUpload = multer({
  limits: { fileSize: maxConsultationImageBytes, files: 1 },
  storage: multer.memoryStorage(),
}).single('image');

// Chat accepts one attachment per message. Keeping the file in memory means it
// is sent directly to Cloudinary and never written to the gateway disk.
export const messageAttachmentUpload = multer({
  limits: { fileSize: maxChatAttachmentBytes, files: 1 },
  storage: multer.memoryStorage(),
}).single('attachment');
