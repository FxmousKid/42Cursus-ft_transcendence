import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module'; // Import UserModule to access UserModel
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../user/user.model'; // Import User model

@Module({
  imports: [
    UserModule, // Make User repository available
    SequelizeModule.forFeature([User]), // Make User model injectable in this module
    // JwtModule.register({ ... }) // We'll add JWT later if needed for login
    // PassportModule // We'll add Passport later if needed
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService if other modules need it
})
export class AuthModule {} 