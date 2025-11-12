# EDPOS System

## Overview

This is a comprehensive restaurant management system (EDPOS) built for table-based dining operations. The application features a full-stack TypeScript architecture with a React frontend and Express backend, using PostgreSQL for data persistence and Drizzle ORM for database operations. The system focuses on table management, order processing, employee management, and attendance tracking specifically designed for restaurant operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with persistent data storage
- **Session Management**: PostgreSQL-based session storage
- **Data Storage**: Migrated from in-memory to PostgreSQL database

### Development Environment
- **Monorepo Structure**: Shared schema and types between frontend and backend
- **Hot Reload**: Vite dev server with HMR for frontend development
- **Development Server**: tsx for TypeScript execution in development

## Key Components

### Database Schema (shared/schema.ts)
- **Categories**: Product categorization with icons for menu organization
- **Products**: Menu items with SKU, pricing, stock tracking and descriptions
- **Tables**: Restaurant table management with capacity, status, and QR codes
- **Orders**: Table-based order system with customer info, status workflow, and payment tracking
- **Order Items**: Individual menu items within each order with quantities and special requests
- **Transactions**: Legacy POS sales records (maintained for compatibility)
- **Transaction Items**: Legacy line items (maintained for compatibility)
- **Employees**: Staff information with roles and contact details
- **Attendance Records**: Employee clock-in/out, break times, and overtime tracking

### Frontend Components
- **Table Grid**: Visual table layout showing real-time status and occupancy
- **Order Dialog**: Complete ordering interface with menu selection and cart management
- **Order Management**: Kitchen and service staff order tracking with status updates
- **Table Management**: Administrative interface for adding/editing tables
- **POS Interface**: Legacy point-of-sale interface (maintained for compatibility)
- **Product Management**: Menu item administration with categories and pricing
- **Receipt System**: Print-ready receipt generation
- **Employee Management**: CRUD operations for staff management with role-based access
- **Attendance Management**: Time tracking with clock-in/out, break management, and statistics

### Backend Services
- **Storage Layer**: Abstract storage interface with PostgreSQL database implementation
- **API Routes**: RESTful endpoints for tables, orders, products, categories, employees, and attendance
- **Order Workflow**: Automated status transitions and table management
- **Data Validation**: Zod schemas for request/response validation with restaurant-specific rules
- **Database Relations**: Proper foreign key relationships between tables, orders, products, and employees
- **Time Tracking**: Automated calculation of work hours, overtime, and break time
- **Table Status Management**: Real-time table availability and reservation system

## Data Flow

1. **Table Selection**: Staff selects available table from visual grid interface
2. **Order Creation**: Menu items added to cart with special requests and customer information
3. **Order Processing**: Order submitted with automatic table status update to "occupied"
4. **Kitchen Workflow**: Orders progress through status stages (pending → confirmed → preparing → ready → served)
5. **Payment Processing**: Orders marked as paid with automatic table status reset to "available"
6. **Inventory Updates**: Stock levels automatically updated on successful orders
7. **Employee Tracking**: Staff clock-in/out with automatic work hour calculations

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for Neon
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing solution
- **date-fns**: Date manipulation utilities

### UI Dependencies
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for components
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution for development
- **drizzle-kit**: Database migration and introspection tools

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations applied to PostgreSQL instance

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit-specific environment detection

### Production Deployment
- Built application served as static files with Express
- Database migrations run via `drizzle-kit push`
- Session storage uses PostgreSQL with connect-pg-simple

### Development Features
- **Replit Integration**: Cartographer plugin for enhanced development experience
- **Error Overlay**: Runtime error modal for development debugging
- **Hot Module Replacement**: Instant updates during development

## Recent Changes

### January 24, 2025 - Product Management System Implementation
- **Complete Product Management System**: Replaced customer management section with comprehensive product and category management functionality
- **Category Management**: Added full CRUD operations for product categories with icon selection and visual category cards
- **Product Management**: Implemented complete product management with category filtering, stock tracking, and detailed product forms
- **Translation Integration**: Added comprehensive Korean/English/Vietnamese translations for all product management features
- **Statistics Dashboard**: Added real-time statistics cards showing total categories, products, and stock levels
- **Interactive Forms**: Created modal dialogs for adding/editing categories and products with validation
- **Search and Filtering**: Implemented product search by name/SKU and category-based filtering functionality
- **Stock Status Display**: Added visual stock status indicators (재고있음/품절) with color-coded badges
- **API Integration**: Connected all forms to existing backend API endpoints for categories and products

### January 24, 2025 - Complete Translation Key Resolution
- **Resolved All Translation Key Issues**: Systematically identified and added all missing translation keys across the entire application
- **Enhanced Tables Module**: Added comprehensive table management translations including 'outOfService', 'people', 'customerName', 'optional', 'customerNamePlaceholder', 'customerCount', 'allCategories', 'stockCount', 'orderHistory', 'itemsSelected', 'noItemsSelected'
- **Improved Inventory Module**: Added missing inventory translations for all languages including 'searchProducts', 'stockStatus', 'allStock', 'productName', 'currentStock', 'unitPrice', 'stockValue', 'management', 'edit', 'stockUpdate'
- **Enhanced Common Module**: Added 'category' key to all language common sections for consistent categorization across modules
- **Fixed Settings Navigation**: Resolved routing issue by ensuring /settings route exists in App.tsx and all navigation links work properly
- **Added NotFound Keys**: Completed notFound module with 'backToHome' and 'backToHome' keys for all supported languages
- **Translation System Optimization**: Improved translation function with proper environment detection and removed debug logging for production

### January 23, 2025 - Comprehensive Translation System Enhancement and Current Cashier Display
- **Resolved Translation Coverage Issues**: Added comprehensive translation keys across all modules to prevent recurring language application problems
- **Enhanced POS System**: Implemented current working cashier display functionality in POS header that shows active cashier name or fallback text when no cashier is clocked in
- **Navigation Translation**: Added complete navigation menu translations for all supported languages (Korean, English, Vietnamese)
- **POS Module Expansion**: Extended POS translations to include stock status, categories, cart management, and receipt functionality
- **Attendance System Enhancement**: Added comprehensive attendance management translations including statistics, work hours tracking, and employee status
- **Settings and Suppliers**: Complete translation coverage for system settings and supplier management modules
- **Real-time Data Integration**: Successfully integrated attendance data with POS header to display current working cashier information
- **Application Stability**: Fixed critical errors preventing app startup due to broken i18n imports and missing translation keys

### January 23, 2025 - Language System Fix and Comprehensive Translation Implementation  
- **Fixed Critical i18n System**: Resolved broken internationalization file that contained plain text instead of TypeScript code
- **Comprehensive Translation System**: Implemented complete multilingual support for Korean, English, and Vietnamese
- **Missing Translation Keys**: Added all missing translation keys including 'tables.cleanupComplete' and other component-specific translations
- **Hot Module Replacement**: Ensured seamless language switching with automatic component updates

### January 21, 2025 - Logo Update and System Improvements
- **Updated EDPOS Logo**: Replaced application logo with new EDPOS branding (EDPOS_1753091767028.png) across header and receipt components
- **Hardcoded Text Elimination**: Completed removal of hardcoded text including cashier names, replaced with proper multi-language support
- **Translation System Enhancement**: Added comprehensive POS translations across Korean, English, and Vietnamese languages
- **Navigation System Fix**: Resolved table management navigation issues with proper sidebar and header menu integration
- **Duplicate Key Cleanup**: Eliminated duplicate translation keys causing syntax errors in i18n system
- **Multi-language Cashier Names**: Added default cashier names for each language (김담당자, John Smith, Nguyễn Thu Ngân)
- **Added Inventory Management**: Complete inventory management system with stock tracking, low stock alerts, and stock value calculations
- **Stock Update Functionality**: Added ability to add, subtract, or set stock levels with notes for audit trail
- **Inventory Dashboard**: Created comprehensive inventory dashboard with real-time statistics and filtering options
- **API Integration**: Built RESTful API endpoints for inventory operations and stock updates
- **Navigation Updates**: Added inventory management to both left sidebar and top navigation menu

### January 20, 2025 - UI Theme Transformation
- **Transformed UI to Modern Green Theme**: Changed from blue theme to green grocery shop style inspired by provided design
- **Updated Color Scheme**: Changed primary colors from blue to green throughout the application (#10b981)
- **Enhanced Visual Design**: Added rounded corners (rounded-xl, rounded-2xl), subtle background patterns, and modern shadows
- **Improved Product Cards**: Updated product grid with modern, rounded card design and green pricing display
- **Updated Navigation**: Modified header dropdown, sidebar, and category selection to use green accent colors
- **Added Background Pattern**: Implemented subtle green circular pattern background across all pages for cohesive design
- **Logo Enhancement**: Increased logo size from h-8 to h-12 for better visibility
- **Sidebar Migration**: Moved navigation sidebar from right to left side with updated styling

The architecture supports both development flexibility and production scalability, with clear separation between frontend and backend concerns while maintaining type safety across the entire stack.