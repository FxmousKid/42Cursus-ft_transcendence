FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Remove existing lock files
RUN rm -f package-lock.json bun.lockb

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host"] 
