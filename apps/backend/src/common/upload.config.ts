import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES_PER_PROPERTY = 10;

// __dirname here = dist/src/common in compiled output → 3 levels up = apps/backend
export const UPLOADS_BASE =
  process.env.UPLOADS_PATH ?? join(__dirname, '..', '..', '..', 'uploads');

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export const imageFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WebP'), false);
  }
};

export const propertyImageStorage = diskStorage({
  destination: join(UPLOADS_BASE, 'properties'),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${randomUUID()}${ext}`);
  },
});
