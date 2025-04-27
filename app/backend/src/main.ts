import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	);

	const config = new DocumentBuilder()
		.setTitle('API Documentation')
		.setDescription('Description of the APIs')
		.setVersion('0.1')
		.addTag('api')
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document, {
		  customCss: readFileSync('./swagger/SwaggerDark.css', 'utf8'),
	});

	// Enable CORS
	app.enableCors({
		origin: '*', // Allow all origins
		methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
		allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
	});
	
	await app.listen(3000, '0.0.0.0');
}
bootstrap();
