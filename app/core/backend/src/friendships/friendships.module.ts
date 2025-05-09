import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Friendships } from './friendships.model';

@Module({
	imports: [
		SequelizeModule.forFeature([Friendships]) // Registering friendship model
	]
})
export class FriendshipsModule { }
