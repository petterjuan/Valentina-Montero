# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy build-time environment variables
COPY .env.build .env

# Copy app files
COPY . .

# Build Next.js app
RUN npm run build

# Start app
CMD ["npm", "start"]












