# Transcendence Backend

This is the Fastify implementation of the backend for the Transcendence project, complying with the "Major module: Use a framework to build the backend" requirement in the project subject.

## Features

- User authentication and management
- Real-time friend system
- Game matching and history
- WebSocket integration for real-time features
- REST API with Swagger documentation

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

4. Configure environment variables:
   - Create a `.env` file based on `.env.example`
   - Set the appropriate values

### Development

To run the application in development mode:

```bash
npm run dev
```

### Production Build

To build the application for production:

```bash
npm run build
```

To run the production build:

```bash
npm start
```

### Docker

To run the application using Docker:

```bash
docker-compose up -d
```

## API Documentation

Once the server is running, you can access the API documentation at:

```
http://localhost:3001/api-docs
```

## Framework Implementation

This backend uses Fastify as the framework to comply with the requirements of the ft_transcendence project.
._.