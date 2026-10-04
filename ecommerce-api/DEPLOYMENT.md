# Deployment Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account or MongoDB server
- Domain name (optional but recommended)

## Environment Variables

Create a `.env` file with these variables:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=generate_a_secure_random_string_at_least_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-url.com
```

**⚠️ IMPORTANT SECURITY:**
- Never commit `.env` files to Git
- Generate a strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Use MongoDB Atlas or secured MongoDB instance with authentication
- Enable MongoDB IP whitelist for production

## Deployment Options

### 1. Heroku

```bash
# Install Heroku CLI
heroku login
heroku create your-app-name

# Add MongoDB
heroku addons:create mongodbatlas:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_here
heroku config:set CLIENT_URL=https://your-frontend.com

# Deploy
git push heroku master

# Seed database (optional)
heroku run npm run seed
```

### 2. Railway

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add MongoDB plugin
4. Set environment variables in dashboard
5. Deploy automatically on push

### 3. Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### 4. DigitalOcean App Platform

1. Go to [digitalocean.com/products/app-platform](https://www.digitalocean.com/products/app-platform)
2. Create new app from GitHub
3. Add MongoDB database
4. Configure environment variables
5. Deploy

### 5. VPS (Manual Deployment)

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone repository
git clone your-repo-url
cd ecommerce-api

# Install dependencies
npm install --production

# Create .env file
nano .env
# (paste your production environment variables)

# Start with PM2
pm2 start server.js --name ecommerce-api
pm2 save
pm2 startup

# Setup Nginx as reverse proxy (recommended)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/api
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment

### 1. Test the API
```bash
# Health check
curl https://your-api-url.com/api/health

# Register a user
curl -X POST https://your-api-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'
```

### 2. Seed Database (Optional)
```bash
npm run seed
```

This creates:
- Admin account: `admin@example.com / admin123`
- User account: `user@example.com / user123`
- Sample products

### 3. Monitor
- Set up logging service (e.g., Logtail, Papertrail)
- Monitor uptime (e.g., UptimeRobot, Pingdom)
- Track errors (e.g., Sentry)

### 4. Backup Database
- Enable automated backups on MongoDB Atlas
- Or set up cron job for manual backups

## Security Checklist

- [ ] Strong JWT_SECRET (min 32 characters)
- [ ] HTTPS enabled (use Let's Encrypt)
- [ ] MongoDB authentication enabled
- [ ] MongoDB IP whitelist configured
- [ ] Rate limiting enabled (already configured)
- [ ] CORS properly configured with specific origins
- [ ] Environment variables secured
- [ ] Regular dependency updates
- [ ] Security headers enabled (Helmet - already configured)

## Scaling Considerations

- Use Redis for session management
- Add CDN for static assets
- Implement caching layer
- Set up database replicas
- Use load balancer for multiple instances
- Implement logging and monitoring

## Troubleshooting

**MongoDB Connection Failed:**
- Check MONGO_URI format
- Verify database credentials
- Check IP whitelist on MongoDB Atlas

**JWT Errors:**
- Verify JWT_SECRET is set
- Check token expiration

**Port Already in Use:**
- Change PORT in .env
- Kill process using the port: `lsof -ti:5000 | xargs kill -9`

## Support

For issues and questions, check the main [README.md](README.md)
