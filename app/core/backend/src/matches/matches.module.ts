import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Matches } from './matches.model';

@Module({
	imports: [
		SequelizeModule.forFeature([Matches]) // Registering friendship model
	]
})
export class MatchesModule { }
