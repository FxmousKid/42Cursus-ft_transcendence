import { Controller, Post, Body, ValidationPipe, UsePipes, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth') // Route de base pour ce contrôleur
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private readonly authService: AuthService) {}

  @Post('register') // Endpoint pour POST /auth/register
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorHttpStatusCode: 422
  }))
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Registration attempt for user: ${createUserDto.email}`);
    
    try {
      const user = await this.authService.register(createUserDto);
      
      return {
        success: true,
        user
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);
      
      throw new HttpException(
        { 
          success: false, 
          message: error.message || 'Registration failed' 
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint de login sera implémenté ultérieurement
} 