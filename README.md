# AI Chat Application

A full-stack AI chat application with conversation intelligence features, built with Django REST Framework and React.

## 🚀 Features

- 💬 Real-time chat with AI models (OpenAI/Claude/Gemini)
- 📚 Conversation history and management
- 🔍 Semantic search across conversations
- 📝 Conversation summarization
- 🧠 Context-aware responses
- 🔒 Secure authentication with JWT
- 📱 Responsive design
- 🚀 Production-ready deployment

## 🛠 Tech Stack

### Backend
- **Framework**: Django REST Framework
- **Language**: Python 3.8+
- **Database**: PostgreSQL
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **UI Components**: Headless UI

### Infrastructure
- **Web Server**: Nginx
- **Application Server**: Gunicorn
- **Process Manager**: systemd
- **CI/CD**: GitHub Actions (optional)

## 📁 Project Structure

```
ai_chat/
├── backend/           # Django backend
│   ├── config/        # Project configuration
│   ├── chat/          # Chat application
│   └── users/         # User management
└── frontend/          # React frontend
    ├── public/        # Static files
    └── src/           # Source code
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai_chat
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Edit .env with your API URL
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:8000/admin

## 🚀 Production Deployment

For detailed production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Production Setup

1. **Set up environment variables**
   ```bash
   cp .env.production .env
   # Edit .env with your production settings
   ```

2. **Build the frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Configure the backend**
   ```bash
   cd ../backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py collectstatic
   ```

4. **Set up Gunicorn and Nginx**
   Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🔧 Configuration

### Environment Variables

#### Backend (`.env`)
```
# Django
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=yourdomain.com,localhost

# Database
DB_NAME=ai_chat
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

#### Frontend (`.env`)
```
VITE_API_URL=https://your-api-url.com
VITE_APP_NAME="AI Chat"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Django](https://www.djangoproject.com/)
- [React](https://reactjs.org/)
- [OpenAI](https://openai.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">
  Made with ❤️ by [Your Name]
</div>
   ```

5. Start the development server:
   ```
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/ai_chat
OPENAI_API_KEY=your_openai_api_key
```
