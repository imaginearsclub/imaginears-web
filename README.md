# Imaginears Club

A magical Disney-inspired Minecraft experience brought to life through a modern web platform.

## Overview

Imaginears Club is a Next.js-based web application that powers the online presence of a Disney-themed Minecraft server. The platform provides event management, player applications, administrative tools, and community features.

## Features

- **Event Management**: Create, manage, and display server events with recurring event support
- **Player Applications**: Streamlined application process for new members
- **Admin Dashboard**: Comprehensive administrative tools for managing organizations, members, and settings
- **Authentication**: Secure authentication using Better-Auth with multiple providers
- **Responsive Design**: Mobile-first design with Tailwind CSS and dark mode support
- **Type-Safe Database**: Prisma ORM with MySQL for robust data management

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with React 19
- **Language**: TypeScript
- **Database**: MySQL with [Prisma](https://www.prisma.io/)
- **Authentication**: [Better-Auth](https://www.better-auth.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **Markdown**: React Markdown with GitHub Flavored Markdown support
- **Charts**: Recharts for data visualization

## Prerequisites

- Node.js >= 18.18.0
- npm or yarn
- MySQL database

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/imaginearsclub/imaginears-web.git
cd imaginears-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/imaginears"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Optional: Cloudflare Turnstile (for CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-site-key"
TURNSTILE_SECRET_KEY="your-secret-key"

# Optional: Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### 4. Set Up the Database

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database (optional)
npm run prisma:seed
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run check` - Run both typecheck and lint
- `npm run prisma:seed` - Seed the database with initial data

## Project Structure

```
imaginears-web/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API route handlers
│   ├── apply/             # Application pages
│   ├── events/            # Event pages
│   ├── login/             # Authentication pages
│   └── register/          # Registration pages
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── common/           # Shared components
│   ├── events/           # Event components
│   ├── home/             # Homepage components
│   └── public/           # Public-facing components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication configuration
│   ├── prisma.ts         # Prisma client
│   └── validation/       # Form validation schemas
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema definition
│   └── migrations/       # Database migrations
├── public/               # Static assets
│   ├── icons/           # Icon files
│   └── images/          # Image assets
└── middleware.ts         # Next.js middleware (auth, headers)
```

## Database Schema

The application uses Prisma with MySQL and includes models for:

- **User**: User accounts with authentication
- **Organization**: Server organizations/teams
- **Member**: Organization membership
- **Event**: Server events with recurrence support
- **Application**: Player applications
- **Session**: Authentication sessions
- **Account**: OAuth provider accounts

## Deployment

The application is configured for standalone output, making it suitable for Docker or serverless deployments:

```bash
# Build for production
npm run build

# The output will be in .next/standalone/
```

### Docker Deployment

A typical Dockerfile structure:

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `npm run check` before committing to ensure code quality
- Write meaningful commit messages

## Security

- All authentication is handled through Better-Auth with secure session management
- Middleware protects admin routes with session validation
- Rate limiting is available through Upstash integration
- Content sanitization for user-generated content (Markdown)
- CAPTCHA support via Cloudflare Turnstile

## License

This project is private and proprietary to Imaginears Club.

## Support

For issues, questions, or contributions, please open an issue on GitHub or contact the development team.

---

Made with ✨ by the Imaginears Club team
