import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Friendships } from './friendships.model';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';
import { User } from '../user/user.model';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
	imports: [
		SequelizeModule.forFeature([Friendships, User]), // Registering friendship and user models
		WebsocketModule
	],
	providers: [FriendshipsService],
	controllers: [FriendshipsController],
	exports: [FriendshipsService]
})
export class FriendshipsModule { }
