# Jyotish Career - Project TODO

## Phase 1: Foundation
- [x] Database schema for users, birth charts, and profiles
- [x] Database schema for careers and income streams
- [x] Database schema for astro-career mappings
- [ ] PWA manifest and service worker setup

## Phase 2: Core Astrological Engine
- [x] Birth data input and validation
- [x] Planetary position calculations (using Swiss Ephemeris logic)
- [x] Lagna (Ascendant) calculation
- [x] House cusp calculations
- [x] D1 (Rashi) chart generation
- [x] D2 (Hora) chart - wealth method
- [x] D9 (Navamsa) chart - dharma/life patterns
- [x] D10 (Dasamsa) chart - career/profession
- [x] D24 (Chaturvimshamsha) chart - education/skills
- [x] Vimshottari Dasha calculation
- [x] Planetary strength (Shadbala basics)

## Phase 3: Career Database & Mapping
- [x] Career categories and occupations database
- [x] Modern income streams database
- [x] Planet-to-career attribute mappings
- [x] House-to-work-environment mappings
- [x] Skills and interests mapping rules
- [x] Career recommendation algorithm

## Phase 4: User Interface
- [x] Landing page with app introduction
- [x] User onboarding flow (birth data collection)
- [x] Dashboard with daily insights
- [x] Birth chart visualization (South Indian style)
- [x] Divisional charts viewer (D1, D9, D10)
- [x] Current Dasha display

## Phase 5: Core Features
- [x] Career Pathfinder - personalized recommendations
- [x] Earning Sources explorer
- [x] Timing & Opportunities (auspicious periods)
- [x] Yoga detection and display
- [x] Remedies section
- [x] Profile management

## Phase 6: PWA & Polish
- [x] PWA manifest configuration
- [x] Service worker for offline support
- [x] App icons and splash screens
- [x] TWA configuration for Play Store
- [x] Performance optimization
- [x] Final testing and bug fixes

## Bug Fixes
- [x] Fix redirect issue - verified working (user interaction with date input requires proper keyboard entry)

## New Features
- [x] Remove sign-in requirement for accessing features
- [x] Allow guest users to complete onboarding and view charts
- [x] Store guest data in localStorage (GuestChartContext)
- [x] Add "Sign In to Save" button on all pages for guest users
- [ ] Migrate guest data to user account after sign-in

- [x] Fix nested anchor tag error on Dashboard page

## Critical Bug Fixes
- [x] Fix planetary calculations with accurate algorithms
- [x] Integrate Google Maps for precise lat/long coordinates
- [x] Add North Indian / South Indian chart style toggle
- [x] Fix D9 chart showing D1 chart data
- [x] Fix career scoring algorithm (now produces varied scores)
- [x] Fix career card navigation (clickable cards with detail view)
- [x] Fix earning sources scoring (now produces varied scores)
- [x] Add Active/Passive/Hybrid grouping filters for earning sources
- [x] Fix Mahadasha progress calculation (now shows correct progress)
- [x] Fix Mahadasha timeline (now displays full timeline)
- [x] Add Reset Chart button
- [x] Add New Chart button


## SEO Improvements
- [x] Add meta keywords to landing page
- [x] Add meta description to landing page
- [x] Add Open Graph tags for social sharing
- [x] Optimize heading structure (H1, H2, H3)
- [x] Add schema.org structured data
- [x] Optimize page title for SEO


## Free Astrology API Integration
- [ ] Store API key securely as environment variable
- [ ] Integrate geo-location API for precise lat/long coordinates
- [ ] Integrate planetary calculations API (Planets endpoint)
- [ ] Integrate divisional charts API (D1, D2, D9, D10, D24, etc.)
- [ ] Integrate Vimsottari Dasha calculations
- [ ] Integrate yoga detection and Shad Bala calculations
- [ ] Replace local calculations with API calls
- [ ] Test all API integrations
