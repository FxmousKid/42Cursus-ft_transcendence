FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Install zsh, git, curl, jq
RUN apk add zsh git curl jq && \
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" || true

# Copy source code
COPY . .

# Build the application ## TEMPORARILY REMOVED BECAUSE OF BREAKING CHANGE
# RUN npm run build 

# Expose the port
EXPOSE 3000

# Start the application
# CMD ["npm", "start"] 
# added in the compose file
