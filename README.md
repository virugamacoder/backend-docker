

# Full DevOps Flow (Docker + CI/CD + AWS + Nginx + Zero Downtime)

This document is a **personal reference guide** for the complete backend deployment workflow using:

- Node.js API
- Docker
- Docker Hub
- GitHub Actions (CI/CD)
- AWS EC2
- Nginx Reverse Proxy
- Blue-Green / Zero-Downtime Deployment

This guide explains **how production backend deployments work in industry environments**.

---

# 1. System Architecture Overview

```
Production flow:

User
 ↓
Nginx Reverse Proxy
 ↓
Docker Container (Node API)
 ↓
MongoDB / Other Services

```

```
Deployment pipeline:

Developer Push
 ↓
GitHub
 ↓
GitHub Actions
 ↓
Build Docker Image
 ↓
Push Docker Image → Docker Hub
 ↓
EC2 Server pulls image
 ↓
Deploy container
 ↓
Nginx routes traffic
```

---

# 2. Project Folder Structure

Example backend project:
```
backend-project/
│
├── server.js
├── package.json
├── Dockerfile
├── docker-compose.yml
└── .github/
    └── workflows/
        └── deploy.yml
```
---

# 3. Node API Example

server.js

```javascript
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "Node API running with Docker 🚀"
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

---

# 4. Dockerfile

Used to build container image.

```Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node","server.js"]
```

Build image locally:

```
docker build -t node-api .
```

Run container locally:

```
docker run -p 3000:3000 node-api
```

---

# 5. Docker Compose (Optional Local Dev)

docker-compose.yml

```yaml
version: "3.9"

services:

  api:
    build: .
    container_name: node-api
    ports:
      - "3000:3000"
    restart: always
    depends_on:
      - mongo

  mongo:
    image: mongo
    container_name: mongo-db
    ports:
      - "27017:27017"
```

Run services:

```
docker compose up -d
```

Stop services:

```
docker compose down
```

---

# 6. Docker Hub Setup

Create repository on Docker Hub.

Example image:

```
username/node-api:latest
```

Login locally:

```
docker login
```

Push image:

```
docker tag node-api username/node-api
docker push username/node-api
```

---

# 7. AWS EC2 Server Setup

Create EC2 instance.

Recommended OS:

```
Amazon Linux 2023
```

Connect using SSH:

```
ssh -i key.pem ec2-user@SERVER_IP
```

---

# 8. Install Docker on EC2

```
sudo dnf install docker -y
sudo systemctl start docker
sudo systemctl enable docker
```

Check installation:

```
docker --version
```

---

# 9. Run Container on EC2

Pull image:

```
docker pull username/node-api:latest
```

Run container:

```
docker run -d -p 3000:3000 --name node-api username/node-api
```

Check running containers:

```
docker ps
```

Test API:

```
curl localhost:3000
```

---

# 10. Install Nginx Reverse Proxy

Install nginx:

```
sudo dnf install nginx -y
```

Start nginx:

```
sudo systemctl start nginx
sudo systemctl enable nginx
```

Check status:

```
sudo systemctl status nginx
```

---

# 11. Nginx Configuration

Config location:

```
/etc/nginx/conf.d/node-api.conf
```

Create file:

```
sudo nano /etc/nginx/conf.d/node-api.conf
```

Example config:

```
upstream node_backend {
    server localhost:3000;
}

server {

    listen 80;

    location / {

        proxy_pass http://node_backend;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;

        proxy_cache_bypass $http_upgrade;
    }
}
```

Test configuration:

```
sudo nginx -t
```

Reload nginx:

```
sudo systemctl reload nginx
```

Now API accessible from:

```
http://SERVER_IP
```

---

# 12. GitHub Actions CI/CD

Location:

```
.github/workflows/deploy.yml
```

Example workflow:

```yaml
name: Docker Build Push Deploy

on:
  push:
    branches:
      - main

jobs:

  build-and-push:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v3

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: username/node-api:latest
```

---

# 13. Deployment Script

CI/CD connects to EC2 via SSH.

Deployment logic:

1. Pull latest image
2. Start new container
3. Health check
4. Switch nginx
5. Remove old container

Example script:

```
docker pull username/node-api:latest

docker run -d -p 3001:3000 --name node-api-new username/node-api:latest

sleep 5

curl localhost:3001

sudo sed -i 's/localhost:3000/localhost:3001/' /etc/nginx/conf.d/node-api.conf

sudo systemctl reload nginx

docker stop node-api
docker rm node-api

docker rename node-api-new node-api
```

---

# 14. Zero Downtime Deployment

Technique used:

```
Blue-Green Deployment
```

Blue container:

```
node-api → port 3000
```

Green container:

```
node-api-new → port 3001
```

Switch nginx after health check.

Deployment flow:

```
Start new container
 ↓
Health check
 ↓
Switch Nginx
 ↓
Remove old container
```

Users never see downtime.

---

# 15. Debugging Commands

Check containers:

```
docker ps
```

View logs:

```
docker logs node-api
```

Check nginx errors:

```
sudo tail -f /var/log/nginx/error.log
```

Check ports:

```
sudo lsof -i :3000
```

---

# 16. Useful Docker Commands

Build image:

```
docker build -t image-name .
```

Run container:

```
docker run -d -p 3000:3000 image-name
```

List containers:

```
docker ps
```

Stop container:

```
docker stop container-id
```

Remove container:

```
docker rm container-id
```

Remove image:

```
docker rmi image-name
```

---

# 17. Production Best Practices

Use:

* Reverse proxy (Nginx)
* Health checks
* Restart policies
* CI/CD automation
* Zero downtime deployments



# 18. Final Production Stack
```
Node.js API
↓
Docker Container
↓
Docker Hub
↓
GitHub Actions CI/CD
↓
AWS EC2
↓
Nginx Reverse Proxy
↓
Blue-Green Deployment
↓
Zero Downtime Production System
```
---



```
