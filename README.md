# TVT Server Documentation

## Overview

TVT Server is a NodeJS-based web server that also supports a WebSocket server for real-time communication. It is containerized using Docker and leverages Redis for caching/session management along with a SQLite database managed via Prisma ORM. Additionally, Prisma Studio is provided for web-based database management.

#### Services TVT Server Integrates:
- TVT RPI's - Connects all active Raspberry Pi's. [TVT RPI Docs](https://github.com/GrishonNganga/tvt-rpi)
- TVT Client - Web application for controlling TVT Server. [TVT Client Docs](https://github.com/GrishonNganga/tvt-client)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.
- Basic knowledge of NodeJS and Docker.

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/GrishonNganga/tvt-server.git
   cd your-repository-directory
   ```
2. **Build and Start Containers**
    Use Docker Compose to build and run all services:
    ```bash
    docker-compose up --build -d
    ```
    This command builds the Docker images and starts the following services:

    - **app**: The main NodeJS application (exposed on port 3000).
    - **redis**: The Redis service (exposed on port 6379).
    - **prisma-studio**: Prisma Studio for database management (exposed on port 5555).

## Environment Variables
The following environment variables are defined in the `docker-compose.yml` file:

- **DATABASE_URL**: Specifies the SQLite database location.
Example: file:/app/data/dev.db

- **JWT_SECRET**: Secret key used to sign JWT tokens. Replace your_jwt_secret_here with a secure secret for production.

- **JWT_EXPIRES_IN**: Specifies the token expiration duration (e.g., 24h).

- **COOKIE_MAX_AGE**: Maximum age of cookies in milliseconds (e.g., 86400000 for 1 day).

- **NODE_ENV**: The application environment (e.g., development or production).

- **REDIS_URL**: Connection string for Redis.
Example: redis://redis:6379

## Project Structure

```graphql
├── Dockerfile
├── docker-compose.yml
├── package.json
├── src/                        
└── prisma/   
```

## Usage
1. #### Starting the Application

Run the following command to start all services:

```bash
docker-compose up --build
```

2. #### Accessing TVT Server
You can only access the services in the TVT server through TVT Client application, make sure the client is running. Refer documentation: https://github.com/GrishonNganga/tvt-client

3. ##### Connecting to the WebSocket Server
The WebSocket server is integrated within the NodeJS app and runs on the same host and port. Clients can connect using the same URL (e.g., ws://localhost:3000).

4. #### Managing the Database
Access Prisma Studio by navigating to http://localhost:5555 in your browser.

5. #### Using Redis
The Redis service is only accessible through TVT Server for handling WebSocket connections. It's available on port 6379, but REDIS_URL environment variable is set accordingly in the app configuration.

## Troubleshooting
- #### Container Startup Issues:
Use the command docker-compose logs app to view logs for the app service and identify any errors during startup.

- #### Database Connection Problems:
Ensure that the DATABASE_URL is correct and that the SQLite data volume (sqlite_data) is properly mounted.

