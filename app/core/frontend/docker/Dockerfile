FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining files
COPY . .

# Build the project
RUN npm run build

# Expose the port
EXPOSE 5173

# Start the static server
CMD ["npm", "run", "dev"] 
