import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { Logger } from '@nestjs/common';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	//creating app
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			logger: true,
			bodyLimit: 10 * 1024 * 1024, // 10MB limit for request body size
			disableRequestLogging: false,
		}), 
		{ 
			logger: ['error', 'warn', 'log'], // Réduire les niveaux de log
		}
	);

	// Global middleware for request logging (uniquement pour les environnements de développement)
	if (process.env.NODE_ENV !== 'production') {
		app.use((req, res, next) => {
			logger.debug(`Request ${req.method} ${req.url}`);
			next();
		});
	}
	
	// Add hook for fastify to ensure proper content-type header
	const fastifyInstance = app.getHttpAdapter().getInstance();
	fastifyInstance.addHook('onSend', (request, reply, payload, done) => {
		// Set content-type header for responses if not already set
		if (!reply.hasHeader('content-type')) {
			reply.header('content-type', 'application/json');
		}
		
		// Ensure payload is valid JSON string or object
		if (payload && typeof payload === 'object' && !Buffer.isBuffer(payload)) {
			try {
				// Convert to properly formatted JSON string
				done(null, JSON.stringify(payload));
			} catch (err) {
				logger.error('JSON stringify error:', err);
				done(null, payload);
			}
		} else {
			done(null, payload);
		}
	});

	// Swagger setup
	const config = new DocumentBuilder()
		.setTitle('API Documentation')
		.setDescription('Description of the APIs')
		.setVersion('0.1')
		.addTag('api')
		.build();

	// Swagger theme setup
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document, {
		  customCss: readFileSync('./swagger/SwaggerDark.css', 'utf8'),
	});

	// Enable CORS for frontend
	app.enableCors({
		origin: ['http://localhost:5173', 'http://localhost:3000', 'http://frontend:5173', 'http://172.21.0.3:5173'], // Frontend URLs
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
	});
	
	// Starting app
	await app.listen(3000, '0.0.0.0');
	logger.log(`Server running on ${await app.getUrl()}`);
}
bootstrap();
