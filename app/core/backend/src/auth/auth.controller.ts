import { Controller, Post, Body, ValidationPipe, UsePipes, Logger, HttpException, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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

  @Post('login')
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorHttpStatusCode: 422
  }))
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for user: ${loginDto.email}`);
    
    try {
      const result = await this.authService.login(loginDto.email, loginDto.password);
      
      this.logger.log(`Login successful for ${loginDto.email}, returning token`);
      this.logger.debug(`Response payload: ${JSON.stringify(result)}`);
      
      return {
        success: true,
        ...result
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      
      throw new HttpException(
        { 
          success: false, 
          message: error.message || 'Login failed' 
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    try {
      await this.authService.logout(req.user.userId);
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
      
      throw new HttpException(
        { 
          success: false, 
          message: error.message || 'Logout failed' 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 