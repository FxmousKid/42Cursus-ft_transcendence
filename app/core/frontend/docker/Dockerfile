FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Remove existing lock files
RUN rm -f package-lock.json bun.lockb

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"] 
