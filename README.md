# Chyoadownloader

## Overview
ChyoaDownloader is a Docker-based application that can be deployed using Portainer for easy management and orchestration.

## Portainer Deployment Guide

### Step 1: Upload Docker Image
Upload the `chyoa-downloader-v2:latest` image to your Docker registry or local Docker daemon.

### Step 2: Docker Compose Configuration
Create a Docker Compose service with the following configuration:

```yaml
services:
  chyoadownloader:
    image: chyoa-downloader-v2:latest
    ports:
      - "1101:1102"  # Port mapping can be adjusted here
    restart: unless-stopped
```

**Port Mapping Explanation:**
- `1101` - External port (access from host machine)
- `1102` - Internal container port

### Step 3: Access the Application
Once deployed, access ChyoaDownloader at:
```
http://localhost:1101
```

## Features
- Easy Docker deployment with Portainer
- Automatic restart policy
- Configurable port mapping
- Lightweight containerized solution

## Support
For issues or questions, please open an issue in the repository.