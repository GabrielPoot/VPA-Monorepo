import { createZodDto } from 'nestjs-zod';
import {
  RegisterSchema,
  LoginSchema,
  VerifyRiotSchema,
} from '@vpa/shared';

// createZodDto bridges the Zod schema to a NestJS architectural DTO class
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class VerifyRiotDto extends createZodDto(VerifyRiotSchema) {}
