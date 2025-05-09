import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  readonly username?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @IsString()
  readonly avatar_url?: string;

  @IsOptional()
  @IsString()
  @Length(6, 255)
  readonly password?: string;

  @IsOptional()
  @IsString()
  readonly status?: string;
} 