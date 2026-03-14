# Portainer implementation
Step 1: Upload image

Step 2: Dockercompose
services:
  chyoadownloader:
    image: chyoa-downloader-v2:latest
    ports:
      - "1101:1101" #port changes can be made here
    restart: unless-stopped

Step 3: Load ChyoaDownloader page
http://localhost:1101

# chyoadownloader
