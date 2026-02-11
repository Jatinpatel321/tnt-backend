# TNT - Tap N Take Development Roadmap

## 🟢 TASK 0 — PROJECT SETUP & ARCHITECTURE
### ✅ FRONTEND PROJECT SETUP
- [x] Create Expo + TypeScript project in tnt-frontend
- [x] Install and configure Expo Router
- [x] Set up production folder structure
- [x] Implement authentication flow (phone + OTP)
- [x] Create tab navigation (Home, Food, Stationery, Orders, Groups, Profile)
- [x] Set up state management (Zustand + Context)
- [x] Create reusable UI components
- [x] Configure API services layer
- [x] Set up navigation guards and auth protection
- [x] Configure app.json for production

## 🟠 PHASE 3 — SLOT INTELLIGENCE (CORE VALUE)
### ✅ TASK 3.1 — BACKEND SLOT EXTENSIONS
- [x] Add faculty_priority flag to slots
- [x] Add slot congestion metric
- [x] Add combined_slot_id (food + stationery)
- [x] Ensure backward compatibility with existing orders
- [x] Default behavior unchanged
- [x] Feature flags allowed

### ✅ TASK 3.2 — FRONTEND SLOT UX
- [x] Add congestion indicator in slot selection
- [x] Add recommended slot highlight
- [x] Add combined pickup notice
- [x] Allow user to override recommendations
- [x] No forced decisions

## 🟡 PHASE 4 — ORDER INTELLIGENCE
### ✅ TASK 4.1 — BACKEND ORDER EXTENSIONS
- [x] Add reorder endpoint
- [x] Add ETA calculation logic
- [x] Add delay detection logic
- [x] Reuse existing validation for reorders
- [x] Prevent item duplication

### ✅ TASK 4.2 — FRONTEND ORDER UX
- [x] Add 1-click reorder functionality
- [x] Add ETA display in order details
- [x] Add delay alerts
- [x] Avoid notification spam
- [x] User controls alerts

## 🟢 PHASE 5 — GROUP CART (HIGH RISK → CAREFUL)
### ✅ TASK 5.1 — BACKEND GROUP CART ENGINE
- [x] Design Group Cart system architecture
- [x] Implement group creation API
- [x] Implement member invite system
- [x] Implement item ownership tracking
- [x] Implement slot locking mechanism
- [x] Implement split or unified payment options
- [x] Handle race conditions with DB transactions
- [x] Ensure idempotent APIs
- [x] Test with concurrent requests

### ✅ TASK 5.2 — FRONTEND GROUP CART UX
- [x] Build member list UI
- [x] Implement live updates for group cart
- [x] Build split payment selector
- [x] Add clear ownership visibility
- [x] Add conflict warnings

## 🔵 PHASE 6 — PAYMENTS & REWARDS
### ✅ TASK 6.1 — BACKEND WALLET & REWARDS
- [x] Implement points ledger system
- [x] Add earn rules logic
- [x] Add redemption rules logic
- [x] Ensure ledger is source of truth
- [x] Use atomic transactions only

### ✅ TASK 6.2 — FRONTEND REWARDS UI
- [x] Build points balance display
- [x] Build rewards history view
- [x] Implement redeem flow
- [x] No fake balances

## 🟣 PHASE 7 — PICKUP EXPERIENCE
### ✅ TASK 7.1 — BACKEND QR PICKUP
- [x] Implement one-time QR generation
- [x] Add vendor confirmation system
- [x] Add audit logs for pickups

### ✅ TASK 7.2 — FRONTEND PICKUP UX
- [x] Display large QR code
- [x] Add clear pickup instructions
- [x] Add express badge for quick pickups

## 🔴 PHASE 8 — AI-READY SIGNALS (RULE-BASED FIRST)
### ✅ TASK 8.1 — BACKEND SIGNAL ENGINE
- [ ] Implement rule-based signal service
- [ ] Add rush hour warning signals
- [ ] Add slot suggestion signals
- [ ] Add reorder prompt signals
- [ ] Ensure deterministic logic (no ML yet)

### ✅ TASK 8.2 — FRONTEND AI UX
- [ ] Surface signals gently in UI
- [ ] Make signals non-blocking
- [ ] Make signals dismissible
- [ ] Avoid dark patterns

## 🔒 PHASE 9 — ADMIN & SECURITY
### ✅ TASK 9.1 — BACKEND ADMIN SYSTEM
- [x] Complete admin module
- [x] Add complaints management
- [x] Add announcements system
- [x] Add fraud flags system
- [x] Add analytics APIs
- [x] Ensure role-protected endpoints
- [x] Add audited actions

### ✅ TASK 9.2 — FRONTEND ADMIN DASHBOARD
- [ ] Build admin UI dashboard
- [ ] Focus on visibility and control
- [ ] Ensure safety features

## 🟢 PHASE 10 — FINAL HARDENING
### ✅ TASK 10.1 — SECURITY REVIEW
- [ ] Perform full security audit
- [ ] Check rate limiting implementation
- [ ] Check for token misuse vulnerabilities
- [ ] Check for replay attack prevention
- [ ] Fix all identified security issues

### ✅ TASK 10.2 — RELEASE PREP
- [ ] Performance tuning
- [ ] Implement API caching
- [ ] Prepare for app store readiness
- [ ] Final testing and validation

## 📋 TASK 2.2 — FRONTEND DISCOVERY UX (Advanced Search UI)
- [x] Build global search bar component
- [x] Implement filter modal with multiple options
- [x] Add sort options functionality
- [x] Implement debounced search
- [x] Add loading skeletons
- [x] Ensure no UI freeze during search
- [x] Make search feel instant
