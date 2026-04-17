import { createZodDto } from 'nestjs-zod';
import { SubmitGallerySchema, CreateCommitmentSchema } from '@vpa/shared';

export class CreateCommitmentDto extends createZodDto(CreateCommitmentSchema) {}
export class SubmitGalleryDto extends createZodDto(SubmitGallerySchema) {}
