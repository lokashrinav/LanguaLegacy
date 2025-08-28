# LanguaLegacy - Endangered Languages Preservation Platform

## Overview

LanguaLegacy is a full-stack web application designed to help preserve endangered languages through community-driven contributions and AI-powered learning tools. The platform enables users to discover endangered languages, contribute audio recordings and cultural content, and learn through automatically generated lessons. With over 40% of the world's 6,000+ languages at risk of disappearing, LanguaLegacy addresses this urgent problem by providing tools for documentation, learning, and preservation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handlers
- **Middleware**: Custom logging, JSON parsing, and error handling
- **Authentication**: Replit OIDC integration with Passport.js strategies
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Relational design with tables for users, languages, contributions, lessons, and learning progress
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon serverless PostgreSQL with connection pooling

### Authentication & Authorization
- **Provider**: Replit OIDC (OpenID Connect) integration
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration
- **User Management**: Automatic user creation/updates from OIDC claims

### Core Data Models
- **Languages**: Metadata including name, region, threat level, speaker count, and cultural information
- **Contributions**: User-submitted content (audio, text, translations) with approval workflow
- **Lessons**: AI-generated learning content with difficulty progression
- **Learning Progress**: User progress tracking with streak counters and completion status

### AI Integration Architecture
The application is designed to integrate with open-source AI tools:
- **Speech-to-Text**: OpenAI Whisper for audio transcription
- **Translation**: Meta's NLLB-200 or HuggingFace MarianMT models
- **Text-to-Speech**: Coqui TTS for audio generation
- **Lesson Generation**: Automated course creation from contributed content

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for database connectivity
- **drizzle-orm**: Type-safe ORM for PostgreSQL operations
- **express**: Web framework for API server
- **passport**: Authentication middleware with OpenID Connect strategy

### UI & Frontend
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form handling with validation
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing library

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the entire application
- **drizzle-kit**: Database migration and introspection tools
- **esbuild**: JavaScript bundler for production builds

### Third-Party Services
- **Replit Authentication**: OIDC provider for user authentication
- **Neon Database**: Serverless PostgreSQL hosting
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Typography (Inter, DM Sans, Fira Code, Geist Mono)

### Planned AI Integrations
- **OpenAI Whisper**: Open-source speech recognition
- **Meta NLLB-200**: Multilingual machine translation
- **Coqui TTS**: Open-source text-to-speech synthesis
- **HuggingFace Transformers**: Various NLP models for content processing