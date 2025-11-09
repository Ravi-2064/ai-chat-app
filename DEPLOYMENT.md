# Production Deployment Guide

This guide provides step-by-step instructions for deploying the AI Chat application to a production environment.

## Prerequisites

- Linux server (Ubuntu 20.04/22.04 recommended)
- Python 3.8+
- PostgreSQL 12+
- Node.js 16+ (for frontend build)
- Nginx
- Supervisor or systemd
- SSL certificate (Let's Encrypt recommended)

## Server Setup

1. **Update system packages**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install required system packages**
   ```bash
   sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib libpq-dev
   ```

3. **Create a system user for the application**
   ```bash
   sudo useradd --system --user-group --shell /bin/bash --create-home aichat
   sudo passwd aichat
   ```

## Database Setup

1. **Login to PostgreSQL**
   ```bash
   sudo -u postgres psql
   ```

2. **Create database and user**
   ```sql
   CREATE DATABASE ai_chat_prod;
   CREATE USER aichat_user WITH PASSWORD 'secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE ai_chat_prod TO aichat_user;
   ALTER ROLE aichat_user SET client_encoding TO 'utf8';
   ALTER ROLE aichat_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE aichat_user SET timezone TO 'UTC';
   \q
   ```

## Application Setup

1. **Clone the repository**
   ```bash
   sudo -u aichat -H bash -c 'cd ~ && git clone <your-repository-url> ai_chat'
   cd /home/aichat/ai_chat
   ```

2. **Set up Python virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.production .env
   # Edit .env with your production settings
   nano .env
   ```

4. **Run migrations**
   ```bash
   cd backend
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py createsuperuser
   ```

## Frontend Build

1. **Install Node.js and dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   cd /home/aichat/ai_chat/frontend
   npm install
   ```

2. **Build the frontend**
   ```bash
   npm run build
   ```

## Configure Nginx

1. **Create Nginx configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/ai_chat
   ```

2. **Add the following configuration** (adjust domain names as needed):
   ```nginx
   upstream ai_chat_server {
       server unix:/home/aichat/ai_chat/run/gunicorn.sock fail_timeout=0;
   }

   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
       ssl_session_timeout 1d;
       ssl_session_cache shared:SSL:10m;
       ssl_session_tickets off;

       # HSTS (uncomment after testing)
       # add_header Strict-Transport-Security "max-age=63072000" always;

       # Frontend
       location / {
           root /home/aichat/ai_chat/frontend/dist;
           try_files $uri /index.html;
       }

       # Backend API
       location /api/ {
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header Host $http_host;
           proxy_redirect off;
           proxy_pass http://ai_chat_server;
       }

       # Django admin static files
       location /static/ {
           alias /home/aichat/ai_chat/backend/staticfiles/;
       }

       # Media files
       location /media/ {
           alias /home/aichat/ai_chat/backend/media/;
       }
   }
   ```

3. **Enable the site and test configuration**
   ```bash
   sudo ln -s /etc/nginx/sites-available/ai_chat /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Configure Gunicorn

1. **Install Gunicorn**
   ```bash
   pip install gunicorn
   ```

2. **Create Gunicorn service file**
   ```bash
   sudo nano /etc/systemd/system/ai_chart.service
   ```

3. **Add the following configuration**
   ```ini
   [Unit]
   Description=AI Chat Gunicorn Service
   After=network.target

   [Service]
   User=aichat
   Group=www-data
   WorkingDirectory=/home/aichat/ai_chat/backend
   Environment="DJANGO_SETTINGS_MODULE=config.settings.production"
   Environment="DJANGO_ENV=production"
   ExecStart=/home/aichat/ai_chat/venv/bin/gunicorn --workers 3 --bind unix:/home/aichat/ai_chat/run/gunicorn.sock config.wsgi:application
   Restart=on-failure
   
   [Install]
   WantedBy=multi-user.target
   ```

4. **Start and enable the service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start ai_chat
   sudo systemctl enable ai_chat
   ```

## SSL Certificate (Let's Encrypt)

1. **Install Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Set up automatic renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

## Monitoring and Maintenance

1. **Set up log rotation**
   ```bash
   sudo nano /etc/logrotate.d/ai_chat
   ```
   Add:
   ```
   /home/aichat/ai_chat/logs/*.log {
       daily
       missingok
       rotate 14
       compress
       delaycompress
       notifempty
       create 0640 aichat www-data
       sharedscripts
       postrotate
           systemctl restart ai_chat
       endscript
   }
   ```

2. **Set up backup**
   ```bash
   # Database backup
   sudo -u postgres pg_dump ai_chat_prod > /backup/ai_chat_db_$(date +%Y%m%d).sql
   
   # Media files backup
   tar -czf /backup/ai_chat_media_$(date +%Y%m%d).tar.gz /home/aichat/ai_chat/backend/media/
   ```

## Updating the Application

1. **Pull the latest changes**
   ```bash
   cd /home/aichat/ai_chat
   git pull origin main
   source venv/bin/activate
   pip install -r backend/requirements.txt
   cd backend
   python manage.py migrate
   python manage.py collectstatic --noinput
   cd ../frontend
   npm install
   npm run build
   sudo systemctl restart ai_chat
   ```

## Security Considerations

1. **Firewall configuration**
   ```bash
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

2. **Regular updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Database security**
   - Regularly backup your database
   - Use strong passwords
   - Limit database access to application server only

4. **Application security**
   - Keep dependencies updated
   - Regularly rotate secrets
   - Monitor for security advisories

## Troubleshooting

- **Check application logs**: `sudo journalctl -u ai_chat -f`
- **Check Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
- **Check database connection**: `psql -h localhost -U aichat_user -d ai_chat_prod`
- **Check Gunicorn socket**: `ls -la /home/aichat/ai_chat/run/`

## Maintenance Mode

To put the site in maintenance mode:

1. **Create a maintenance page** in your frontend
2. **Update Nginx** to serve the maintenance page
3. **Restart Nginx**: `sudo systemctl restart nginx`

Remember to test your deployment in a staging environment before deploying to production.
