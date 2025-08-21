# Invoice Generator

## Overview

This is a full-stack invoice generator application built with React and Express.js. The application allows users to create, manage, and send professional invoices with features like PDF generation, email delivery, QR code integration, and invoice hosting. The system supports both draft management and persistent invoice storage with a complete invoice lifecycle from creation to payment tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack React Query for server state and local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation integration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: Express sessions with PostgreSQL session store
- **File Handling**: Multer for image uploads with size and type validation
- **Development**: Hot module reloading with Vite integration

### Database Design
- **Invoice Table**: Comprehensive invoice data including company info, client details, financial calculations, and hosting options
- **Line Items Table**: Individual invoice line items with foreign key relationship to invoices
- **Schema Management**: Drizzle migrations with PostgreSQL-specific features
- **Data Validation**: Zod schemas shared between frontend and backend

### Core Features
- **Invoice Management**: Full CRUD operations for invoices with draft and published states
- **PDF Generation**: Client-side PDF creation using React-PDF library
- **Email Integration**: SMTP-based email delivery with customizable templates
- **QR Code Generation**: Dynamic QR codes for hosted invoices
- **Image Handling**: Logo upload and storage with optimization
- **Invoice Hosting**: Public invoice hosting with optional password protection

### Development Workflow
- **Monorepo Structure**: Shared types and schemas between client and server
- **Type Safety**: End-to-end TypeScript with strict compilation
- **Code Organization**: Feature-based component structure with reusable UI components
- **Build Process**: Separate client and server builds with production optimization

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with migration support

### Email Services
- **Nodemailer**: SMTP email client supporting various providers
- **Email Templates**: HTML email generation with invoice attachments

### File Processing
- **QRCode Library**: QR code generation for invoice links
- **React-PDF**: Client-side PDF document generation
- **Multer**: Server-side file upload handling

### UI Dependencies
- **Radix UI**: Headless UI primitives for accessibility
- **Lucide React**: Icon library with consistent design
- **Tailwind CSS**: Utility-first CSS framework
- **Class Variance Authority**: Type-safe component variants

### Development Tools
- **Vite**: Fast build tool with hot module reloading
- **TypeScript**: Static type checking across the stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment optimizations