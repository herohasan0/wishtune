# Docker Deployment Guide for Wishtune

**Step-by-step guide starting from an empty VPS terminal.**

## 🚀 Quick Start Summary

1. **Install Docker** on your VPS (Step 1)
2. **Upload your code** to the VPS (Step 2)
3. **Create `.env` file** with your credentials (Step 4)
4. **Run `docker-compose up -d --build`** (Step 5)
5. **Access your app** at `http://your-server-ip:3000`

That's it! Read below for detailed instructions.

---

## Step 1: Install Docker on Your VPS

You're in the VPS terminal and see nothing when you run `ls`. That's normal! Let's start by installing Docker.

**Run these commands one by one in your VPS terminal:**

```bash
# First, update your system
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (needed to run docker-compose commands)
sudo apt install docker-compose -y

# Allow your user to run Docker without sudo (optional but recommended)
sudo usermod -aG docker $USER

# Verify Docker is installed
docker --version
docker-compose --version
```

**Note:** If you see "command not found" after adding yourself to docker group, you may need to log out and log back in, or run `newgrp docker`.

---

## Step 2: Get Your Code onto the VPS

You have **3 options** to get your code onto the server. Choose the easiest one for you:

### Option A: Using Git (Recommended if you have a Git repository)

**On your VPS terminal:**

```bash
# Install Git if not already installed
sudo apt install git -y

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/wishtune.git

# Go into the project folder
cd wishtune
```

### Option B: Upload Files via SFTP/File Manager

**On your LOCAL computer:**

1. If your VPS provider has a file manager in the dashboard, use it to upload your entire `wishtune` folder
2. Or use an SFTP client like FileZilla, WinSCP, or Cyberduck
3. Upload the entire `wishtune` folder to `/home/yourusername/wishtune` (or wherever you want)

**Then on your VPS terminal:**

```bash
# Navigate to where you uploaded the files
cd ~/wishtune
# or
cd /home/yourusername/wishtune
```

### Option C: Using SCP from Your Local Computer

**On your LOCAL computer terminal (Mac/Linux) or PowerShell (Windows):**

```bash
# Replace these with your actual values:
# - yourusername: your VPS username
# - your-server-ip: your VPS IP address or domain
# - /path/to/wishtune: the path to your project on your computer

scp -r /Users/hasankahraman/Desktop/playground/wishtune yourusername@your-server-ip:/home/yourusername/wishtune
```

**Then on your VPS terminal:**

```bash
cd ~/wishtune
ls  # You should now see your project files!
```

---

## Step 3: Verify Files Are on the Server

**On your VPS terminal, make sure you're in the project folder:**

```bash
# Check current directory
pwd

# List files (you should see Dockerfile, docker-compose.yml, package.json, etc.)
ls -la

# Make sure these files exist:
ls Dockerfile
ls docker-compose.yml
ls package.json
```

If you see these files, you're good to go! ✅

---

## Step 4: Create Environment Variables File

**On your VPS terminal (still in the project folder):**

```bash
# Create the .env file
nano .env
```

**In the nano editor, paste this template and fill in your actual values:**

```env
# NextAuth Configuration
# Generate AUTH_SECRET with: openssl rand -base64 32
AUTH_SECRET=your-auth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase Admin SDK (Option 1: Environment Variables - Recommended)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**To save in nano:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**To generate AUTH_SECRET, run this in your VPS terminal:**
```bash
openssl rand -base64 32
```
Copy the output and paste it as your `AUTH_SECRET` value.

**For Firebase credentials:**
- Open your `firebase-service-account.json` file on your local computer
- Copy the `project_id` → use as `FIREBASE_ADMIN_PROJECT_ID`
- Copy the `client_email` → use as `FIREBASE_ADMIN_CLIENT_EMAIL`
- Copy the `private_key` → use as `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` characters)

---

## Step 5: Build and Start Your Application

**On your VPS terminal (still in the project folder):**

```bash
# Build and start the container (this will take a few minutes)
docker-compose up -d --build

# Watch the logs to see if everything starts correctly
docker-compose logs -f
```

**Press `Ctrl + C` to stop watching logs** (the container will keep running).

**Check if it's running:**
```bash
docker-compose ps
```

You should see your container running! ✅

**Test if your app is working:**
```bash
curl http://localhost:3000
```

If you see HTML output, your app is running! 🎉

---

## ✅ Pre-Deployment Checklist

Before running `docker-compose up -d --build`, make sure:

- [ ] Docker is installed (`docker --version` works)
- [ ] Docker Compose is installed (`docker-compose --version` works)
- [ ] You're in the project folder (`ls` shows Dockerfile, docker-compose.yml, package.json)
- [ ] `.env` file exists (`ls .env` shows the file)
- [ ] `.env` file has all required variables filled in
- [ ] You've generated `AUTH_SECRET` using `openssl rand -base64 32`
- [ ] Firebase credentials are correct

---

## Step 6: Access Your Application

Your app is now running on port 3000. You can access it in two ways:

### Option 1: Direct IP Access (Temporary - for testing)

Visit: `http://your-server-ip:3000` in your browser

**Note:** You may need to open port 3000 in your VPS firewall:
```bash
sudo ufw allow 3000
```

### Option 2: Set Up Domain with Nginx (Recommended for production)

See the "Set Up Reverse Proxy" section below.

---

## Quick Reference: Common Commands

**View logs:**
```bash
docker-compose logs -f
```

**Stop the application:**
```bash
docker-compose down
```

**Start the application:**
```bash
docker-compose up -d
```

**Restart the application:**
```bash
docker-compose restart
```

**Check if it's running:**
```bash
docker-compose ps
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

---

## Post-Deployment

### Verify Deployment

**On your VPS terminal:**

1. Check if the container is running:
   ```bash
   docker-compose ps
   # or
   docker ps
   ```

2. Check application logs:
   ```bash
   docker-compose logs -f wishtune
   ```

3. Test your application:
   ```bash
   curl http://localhost:3000
   ```

If you see HTML output, everything is working! ✅

### Set Up Reverse Proxy with Nginx (Recommended for Production)

This allows you to access your app via a domain name (like `https://yourdomain.com`) instead of `http://your-ip:3000`.

**On your VPS terminal:**

1. Install Nginx:
   ```bash
   sudo apt install nginx -y
   ```

2. Create Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/wishtune
   ```

3. **In the nano editor, paste this configuration** (replace `yourdomain.com` with your actual domain):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   
   **Save:** `Ctrl + X`, then `Y`, then `Enter`

4. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/wishtune /etc/nginx/sites-enabled/
   sudo nginx -t  # Test configuration
   sudo systemctl reload nginx  # Apply changes
   ```

5. **Important:** Update your `.env` file with your domain:
   ```bash
   nano .env
   ```
   
   Change `NEXTAUTH_URL` to:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   ```
   
   Save and restart:
   ```bash
   docker-compose restart
   ```

6. Set up SSL (HTTPS) with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com
   ```
   
   Follow the prompts. Certbot will automatically configure HTTPS for you!

## Updating Your Application

When you make changes to your code:

**If using Git:**
```bash
# On your VPS terminal, in the project folder
git pull
docker-compose up -d --build
```

**If uploading files manually:**
```bash
# Upload new files via SFTP/file manager, then:
docker-compose up -d --build
```

## Maintenance Commands

**All commands should be run in your project folder (`cd ~/wishtune`):**

```bash
# Stop the application
docker-compose down

# Start the application
docker-compose up -d

# Restart the application
docker-compose restart

# View logs (real-time)
docker-compose logs -f

# View last 100 lines of logs
docker-compose logs --tail=100

# Remove everything (including volumes) - WARNING: This deletes data!
docker-compose down -v
```

## Troubleshooting

### "Command not found" errors

**If `docker` command not found:**
```bash
# Try logging out and back in, or:
newgrp docker
```

**If `docker-compose` command not found:**
```bash
sudo apt install docker-compose -y
```

### Container won't start

**Check what's wrong:**
```bash
# View detailed logs
docker-compose logs wishtune

# Check if port 3000 is already in use
sudo lsof -i :3000
```

**Common fixes:**
- Make sure your `.env` file exists and has all required variables
- Check that port 3000 is not already in use by another application
- Verify you're in the correct directory (where `docker-compose.yml` is located)

### "Cannot connect to Docker daemon"

**Fix:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker
```

### Build fails

**Check the error:**
```bash
docker-compose logs wishtune
```

**Common issues:**
- Missing files: Make sure all project files are uploaded
- Wrong directory: Run `pwd` to check you're in the project folder
- Network issues: Check your VPS internet connection

### Firebase connection issues

**Symptoms:** App starts but Firebase operations fail

**Fix:**
- Double-check your Firebase credentials in `.env`
- Make sure `FIREBASE_ADMIN_PRIVATE_KEY` includes the `\n` characters (newlines)
- Verify your Firebase service account has proper permissions

### NextAuth/Authentication issues

**Symptoms:** Can't sign in with Google

**Fix:**
- Verify `AUTH_SECRET` is set (generate with `openssl rand -base64 32`)
- Check `NEXTAUTH_URL` matches your domain (or IP if testing)
- Verify Google OAuth credentials are correct
- Make sure Google OAuth redirect URI includes your domain

### Can't access the app from browser

**Check:**
```bash
# Is the container running?
docker-compose ps

# Is port 3000 open?
sudo ufw status
sudo ufw allow 3000  # If not open, run this

# Test locally on server
curl http://localhost:3000
```

**If curl works but browser doesn't:**
- Check your VPS firewall settings
- Verify your domain DNS is pointing to your VPS IP
- Make sure you're using `http://` (not `https://`) unless you set up SSL

## Security Notes

1. **Never commit** `.env` file or `firebase-service-account.json` to Git
2. Use strong, unique `AUTH_SECRET`
3. Keep Docker and system packages updated
4. Use firewall rules to restrict access
5. Consider using Docker secrets for sensitive data in production

## Monitoring

Consider setting up monitoring:

```bash
# View resource usage
docker stats wishtune-app

# Set up log rotation
# Add to /etc/docker/daemon.json:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

