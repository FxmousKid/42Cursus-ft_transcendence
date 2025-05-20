import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
	imports: [
		SequelizeModule.forFeature([User]) // Registering user model
	],
	providers: [UserService],
	controllers: [UserController],
	exports: [UserService]
})
export class UserModule { }