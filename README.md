# Chyoadownloader

## Overview
ChyoaDownloader is a Docker-based application that can be deployed using Portainer for easy management and orchestration.
The tool can be used to download a Chyoa.com story, by pasting the URL of the last story branch into the intended input box.

**Currently avialable download formats are:**
- HTML
- TXT
- MP3 (Experimental)

## Portainer Deployment Guide

### Step 1: Build the docker image
** Portainer **
 - Open the environment in which you wish to create your stack
 - Select `Build a new image` under your 'Images' tab
 - Incert under `Names` the name you wish to call your image (in my case `chyoadownloaderimage`)
 - Select `URL` and incert the following link `https://github.com/jdpagm03-tech/chyoadownloader.git`
 - Select `Build the image`

### Step 2: Docker Compose Configuration
Create a Docker Compose service with the following configuration:

```yaml
services:
  chyoadownloader:
    image: chyoadownloaderimage:latest
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

## Note
- MP3 download funktion is still experimental
