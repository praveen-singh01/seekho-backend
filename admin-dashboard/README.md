# Seekho Admin Dashboard

A comprehensive admin dashboard for managing the Seekho learning platform, built with React and Material-UI.

## Features

### 🎯 Multi-Tenant Support
- Support for multiple apps (Seekho and Bolo)
- Complete data isolation between tenants
- Shared payment system across apps
- App-specific branding and configuration

### 👥 User Management
- View and manage all registered users
- User analytics and engagement metrics
- Search and filter capabilities
- Individual user progress tracking

### 📚 Content Management
- **Categories**: Create and manage learning categories
- **Topics**: Organize content by topics within categories
- **Videos**: Upload, manage, and organize video content
- Hierarchical content structure

### 📊 Analytics & Reporting
- User engagement analytics
- Content performance metrics
- Subscription analytics and revenue tracking
- Real-time dashboard with key metrics

### 💳 Subscription Management
- View and manage user subscriptions
- Revenue tracking and analytics
- Subscription lifecycle management
- Payment history and status

### 🔔 Notifications
- Send targeted notifications to users
- Notification history and analytics
- Multi-channel notification support

### 👨‍💼 Admin User Management
- Create and manage admin accounts
- Role-based access control
- Secure authentication system

## Technology Stack

- **Frontend**: React 18, Material-UI 5
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Icons**: Material-UI Icons, Lucide React

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Access to Seekho backend API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seekho-backend/admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm start
   ```

The application will open at `http://localhost:3001`

### Environment Configuration

Create a `.env.local` file for local development:

```env
# For local backend development
REACT_APP_API_URL=http://localhost:8000

# For development against production API
# REACT_APP_API_URL=https://learner.netaapp.in

GENERATE_SOURCEMAP=true
PORT=3001
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Project Structure

```
admin-dashboard/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AppSelector.js # Multi-tenant app selector
│   │   └── Layout.js      # Main layout component
│   ├── context/          # React context providers
│   │   └── AuthContext.js # Authentication context
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   │   ├── DashboardPage.js
│   │   ├── UsersPage.js
│   │   ├── CategoriesPage.js
│   │   ├── TopicsPage.js
│   │   ├── VideosPage.js
│   │   ├── AnalyticsPage.js
│   │   ├── SubscriptionsPage.js
│   │   └── NotificationsPage.js
│   ├── services/         # API services
│   │   └── api.js        # Axios configuration
│   └── utils/            # Utility functions
├── .env                  # Default environment variables
├── .env.example          # Environment template
├── vercel.json          # Vercel deployment configuration
└── package.json         # Dependencies and scripts
```

## API Integration

The dashboard integrates with the Seekho backend API with the following features:

- **Authentication**: JWT-based admin authentication
- **Multi-tenant**: Package ID header for tenant isolation
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Loading indicators for better UX

### API Configuration

The API client is configured in `src/services/api.js` with:
- Base URL from environment variables
- Automatic JWT token inclusion
- Package ID header for multi-tenant support
- Response interceptors for error handling

## Deployment

### Production Build

```bash
npm run build
```

### Vercel Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add REACT_APP_API_URL
vercel env add GENERATE_SOURCEMAP

# Deploy to production
vercel --prod
```

## Multi-Tenant Architecture

The dashboard supports multiple apps with complete data isolation:

### App Configuration
- **Seekho** (`com.gumbo.learning`): Main learning platform
- **Bolo** (`com.gumbo.english`): English learning focused app

### Implementation
- App selector in header for switching between tenants
- Package ID header sent with all API requests
- Shared authentication and admin management
- Isolated user data, content, and analytics

## Security

- JWT-based authentication
- Secure token storage in localStorage
- HTTPS enforced in production
- CORS properly configured
- No sensitive data exposed to client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for the Seekho learning platform.

## Support

For technical support or questions:
- Check the deployment documentation
- Review the troubleshooting guide
- Contact the development team
