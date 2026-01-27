# Power Plant Calculations

## Overview

Power Plant Calculations is a mobile-first application designed for power plant engineers and technicians to perform critical computations quickly and accurately. The app enables users to track feeder readings, turbine data, perform energy calculations, and generate reports - all with offline support via local storage.

The application follows a bold/industrial design aesthetic with high contrast, electric blue accents, and a dark mode default to reduce eye strain during extended use.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with a bottom tab navigator containing 4 main tabs (Feeders, Turbines, Calculations, Reports)
- **State Management**: React Context API for day-to-day data (`DayContext`), TanStack React Query for server state
- **Animations**: React Native Reanimated for smooth micro-interactions
- **Styling**: Custom theme system with light/dark mode support via ThemeContext, centralized in `client/constants/theme.ts`
- **Theme Modes**: Three options - "system" (follows device), "light", "dark" - persisted via AsyncStorage
- **Path Aliases**: `@/` maps to `./client`, `@shared/` maps to `./shared`

### Backend Architecture
- **Server**: Express.js running on Node.js
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Definition**: Shared between client and server in `shared/schema.ts`
- **Storage Layer**: Abstracted via `IStorage` interface in `server/storage.ts`, currently using in-memory storage with database-ready patterns

### Data Storage
- **Local Storage**: AsyncStorage for offline persistence of daily calculations
- **Data Structure**: Day-based records containing feeder readings (start/end kWh) and turbine data (previous/present readings, hours)
- **Storage Keys**: Prefixed with `pp-app:v2` for versioning

### Key Design Patterns
1. **Stack-per-tab navigation**: Each tab has its own stack navigator for consistent header behavior
2. **Keyboard-aware components**: Custom `KeyboardAwareScrollViewCompat` for cross-platform input handling
3. **Themed components**: `ThemedText`, `ThemedView`, and custom hooks for consistent styling
4. **Error boundaries**: Class-based error boundary with development-mode debugging
5. **Responsive layouts**: `useResponsiveLayout` hook detects tablet vs phone screens (768px breakpoint), enabling 2-column grid layouts on tablets with max content width of 900px
6. **Theme System**: ThemeContext in `client/contexts/ThemeContext.tsx` with:
   - Three modes: "system" (default), "light", "dark"
   - System mode follows device useColorScheme()
   - Persisted to AsyncStorage under `pp-app:theme-mode`
   - Integrated with React Navigation theme
   - useTheme() hook provides theme colors, isDark, mode, and setMode
7. **RTL Bootstrap System**: Centralized RTL/LTR handling in `client/lib/rtl-bootstrap.ts` with:
   - Atomic language and direction persistence via AsyncStorage
   - Loop protection using RELOAD_ATTEMPT_KEY flag to prevent infinite reload cycles
   - Manual restart fallback when automatic reload fails to fix direction mismatch
   - isRTL state stored in LanguageContext after initialization (not read from I18nManager during render)
8. **RTL Navigation Fix**: For Bottom Tabs to visually flip when RTL changes:
   - NavigationContainer uses `key={I18nManager.isRTL ? "rtl" : "ltr"}` to force re-mount
   - MainTabNavigator uses `I18nManager.isRTL` directly (NOT context) as truth source after reload
   - Tab screens array reversed when RTL, initialRouteName set dynamically
   - Tab order controlled ONLY by screen array order (no layout hacks)

### Build Configuration
- **Development**: Expo dev server with Metro bundler, proxied through Replit domains
- **Production**: Static web build via custom build script, server bundled with esbuild
- **Type Safety**: Strict TypeScript configuration with Zod schemas for runtime validation

## External Dependencies

### Core Services
- **PostgreSQL**: Database backend (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations and schema management

### Third-Party Packages
- **Expo Ecosystem**: Font loading, haptics, blur effects, clipboard, splash screen, web browser
- **Google Fonts**: Outfit font family for typography
- **React Navigation**: Native stack and bottom tab navigators
- **TanStack Query**: Server state management and caching

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests
- `REPLIT_DEV_DOMAIN`: Development domain for Expo proxy configuration
- `REPLIT_DOMAINS`: Comma-separated list of allowed CORS origins
- `SUPABASE_URL`: Supabase project URL (server-side)
- `SUPABASE_ANON_KEY`: Supabase anonymous key (server-side)
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL (client-side)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key (client-side)

### Supabase Integration
- **Client**: `client/lib/supabase.ts` - Supabase client with AsyncStorage for session persistence
- **Server**: `server/lib/supabase.ts` - Supabase client for backend operations
- **Authentication**: `client/contexts/AuthContext.tsx` - Handles signup, login, logout, password reset
- **Data Sync**: `client/lib/supabaseSync.ts` - Syncs daily readings to/from Supabase
- **Schema**: `supabase-schema.sql` - Database tables with Row Level Security (run in Supabase SQL Editor)

### Database Tables (Supabase)
- **profiles**: User profiles with display_name and decimal_precision
- **daily_data**: Day records with date_key, linked to user
- **feeders**: Feeder readings (start/end) for each day
- **turbines**: Turbine readings (previous/present/hours) for each day

### Data Flow
1. App loads data from local AsyncStorage first (offline support)
2. If user is logged in, fetches from Supabase and merges with local
3. On save, stores locally and syncs to Supabase in background

### Guest Authentication System
The app supports two modes of operation:

1. **Guest Mode** (default): 
   - On app start, automatically signs in silently as a guest using Supabase Anonymous Sign-In
   - Guest data is stored with RLS policies (user_id = auth.uid())
   - Settings screen shows "Guest Mode" indicator with upgrade options

2. **Full Account Mode** (optional):
   - User can upgrade from Settings by creating an account (adds email/password to their anonymous session)
   - Uses Supabase's built-in account linking - same user_id is retained, so no data migration needed
   - User can also sign into an existing account (creates new session, guest data remains with anonymous user)

**REQUIRED: Enable Anonymous Sign-In**:
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable "Anonymous Sign-In"
3. Without this, users will see "Setup Required" message in Settings

**Key Files**:
- `client/lib/guestAuth.ts` - Guest auth utilities (signInAsGuest, isGuestUser)
- `client/contexts/AuthContext.tsx` - Auth context with guest support and upgradeGuestAccount