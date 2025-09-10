# Magizh Quiz App

## Overview

Magizh Quiz App is a comprehensive full-stack quiz and flashcard application designed for creating, sharing, and studying interactive decks with advanced gamification features, progress tracking, and adaptive learning algorithms. The application implements spaced repetition learning techniques, streak systems, daily challenges, and achievement tracking to create an engaging educational experience. Built as a React Single Page Application with a FastAPI backend, it supports multiple question types (MCQ, multi-select, fill-blank), user profiles with GitHub-style activity tracking, and comprehensive analytics dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a React 18 Single Page Application using TypeScript and Vite for modern development experience. The architecture follows a component-based design with:

- **React Router** for client-side routing and navigation between pages
- **Context API** for global state management, particularly authentication state
- **React Query (@tanstack/react-query)** for server state management, caching, and API synchronization
- **Radix UI** components for accessible, unstyled UI primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Recharts** for data visualization and analytics charts
- **Component structure** organized by feature with shared components, pages, and contexts

### Backend Architecture
The backend follows a RESTful API design using FastAPI with clear separation of concerns:

- **FastAPI** framework with automatic OpenAPI documentation and type validation
- **SQLAlchemy ORM** with declarative models for database abstraction
- **Pydantic schemas** for request/response validation and serialization
- **Router-based modular architecture** separating endpoints by feature (auth, decks, cards, quiz, users)
- **Service layer** for business logic including spaced repetition algorithms and gamification systems
- **Background job processing** using APScheduler for daily challenges and streak tracking
- **Alembic** for database migrations and schema evolution

### Data Storage Solutions
The application uses SQLite as the primary database with a comprehensive relational schema:

- **User management** with Google OAuth integration and username systems
- **Deck and Card models** supporting multiple question types and rich metadata
- **Quiz session tracking** with detailed answer history and performance metrics
- **Gamification tables** for streaks, achievements, daily challenges, and user progress
- **Spaced repetition system** with study plans and adaptive review scheduling
- **Activity logging** for comprehensive user behavior tracking

### Authentication and Authorization
Security is implemented through Google OAuth 2.0 with JWT tokens:

- **Google OAuth 2.0** as the primary authentication method using Authlib
- **JWT tokens** for stateless authentication with secure secret management
- **HTTP-only cookies** for token storage to prevent XSS attacks
- **Username selection** system for user onboarding after OAuth
- **Demo login** functionality for testing and demonstration purposes
- **Role-based access** for public/private deck visibility and ownership

## External Dependencies

### Third-party APIs and Services
- **Google OAuth 2.0** for user authentication and profile information
- **Google APIs** for retrieving user profile data and email verification

### Frontend Libraries
- **@radix-ui/react-*** for accessible UI components (dialogs, dropdowns, tabs, toasts, avatars, progress)
- **@tanstack/react-query** for server state management and caching
- **react-router-dom** for client-side routing and navigation
- **recharts** for data visualization and analytics charts
- **lucide-react** for consistent iconography

### Backend Dependencies
- **FastAPI** web framework with automatic API documentation
- **SQLAlchemy** ORM for database operations and model definitions
- **Authlib** for OAuth 2.0 implementation and JWT handling
- **APScheduler** for background job processing and scheduled tasks
- **Pydantic** for data validation and serialization
- **python-jose** for JWT token creation and verification
- **bcrypt/passlib** for password hashing (if needed for future features)

### Development and Testing Tools
- **Vite** for fast development server and build tooling
- **TypeScript** for type safety across the application
- **ESLint and Prettier** for code quality and formatting
- **Vitest** for frontend unit testing with React Testing Library
- **pytest** for backend testing with httpx for API testing
- **Docker and Docker Compose** for containerized deployment

### Deployment Infrastructure
- **Replit** as the primary hosting platform with environment variable management
- **SQLite** database file for simple deployment without external database services
- **Environment-based configuration** for seamless development to production transitions