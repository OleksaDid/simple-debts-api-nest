# Docker Parent Image with Node and Typescript
FROM node

# Create Directory for the Container
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package*.json /app/
RUN npm install

# Copy the files we need to our new Directory
ADD . /app/

# Expose the port outside of the container
EXPOSE 3000

# Env variables
ARG NODE_ENV=dev
ENV NODE_ENV=${NODE_ENV}
ENV PORT 3000

# Grab dependencies and transpile src directory to dist
RUN npm run build

# Start the server
ENTRYPOINT ["node", "dist/main.js"]
