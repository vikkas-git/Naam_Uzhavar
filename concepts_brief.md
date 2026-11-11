# Full MongoDB Database Persistence & Backend Connectivity Architecture

* **Author:** vikkas
* **Date:** 2026-11-11

## Overview

Naam Uzhavar connects agricultural producers (Farmers), commercial procurement businesses (Buyers), and EV logistics operators (Drivers). While Mongoose models exist for each domain, multiple backend route handlers and frontend services currently use fallback in-memory arrays and browser `localStorage` caches whenever database operations stall or disconnect. This architecture specification defines a strict, no-fallback persistence model where all mutations write directly to 10 verified collections in a local MongoDB Community database (`mongodb://localhost:27017/naam-uzhavar`), observable directly via MongoDB Compass.

## Analysis

### Synthesized Findings Across Review Lenses

1. **Elimination of Phantom Data (Design & Codebase Details)**:
   - When the database is offline or an operation fails, the system must not display an optimistic confirmation. Mutations must only confirm upon receiving an HTTP 200/201 response containing the persisted MongoDB `_id`.
   - Remove all in-memory fallback arrays across backend route files:
     - `backend/routes/crops.js`: Remove `FALLBACK_CROPS` (lines 8–81) and in-memory filter fallbacks (lines 134–157).
     - `backend/routes/farmer.js`: Remove `IN_MEMORY_FARMERS`, `IN_MEMORY_CROPS`, and conditional branches that divert writes to memory.
     - `backend/routes/driver.js`: Remove `DEFAULT_DRIVER` fallback store and `IN_MEMORY_TRIPS`.
     - `backend/routes/auth.js`: Remove `inMemoryBuyers` (lines 30–50) and `inMemoryFarmers`.
     - `backend/routes/profile.js`: Remove `DEMO_BUYER_RECORD`.
   - In frontend services (`src/services/cropService.js` and `src/utils/api.js`), remove silent `localStorage` saves that mask backend failures.

2. **Strict Disconnect Handling (Implementation Readiness & TRIZ)**:
   - Instead of falling back to memory when MongoDB disconnects, the backend must return HTTP `503 Service Unavailable` with error code `DATABASE_OFFLINE`.
   - An auto-reconnecting Mongoose listener handles recovery without requiring a server reboot when `mongod` restarts.
   - The frontend displays an inline error banner and retry option without clearing user inputs.

3. **Compass-Legible 10 Collections Schema (Structural Architecture)**:
   - Currently, invoices are dynamically generated in route memory rather than modeled in Mongoose. Create a dedicated `backend/models/Invoice.js` model to preserve immutable financial snapshots.
   - The complete 10-collection schema in MongoDB Compass:
     1. `buyers` (`models/Buyer.js`): Registered procurement entities (hotels, supermarkets, caterers).
     2. `farmers` (`models/Farmer.js`): Verified farmers with land area and masked bank credentials.
     3. `crops` (`models/Crop.js`): Available produce consignments across Tamil Nadu hubs.
     4. `orders` (`models/Order.js`): Commercial orders linking buyer, farmer, crop, and status.
     5. `buyerrequests` (`models/BuyerRequest.js`): Price negotiation enquiries and direct quotes.
     6. `invoices` (`models/Invoice.js`): Permanent tax invoices with GST calculations and status.
     7. `messages` (`models/Message.js`): Communication thread between buyer, hub, and driver.
     8. `drivers` (`models/Driver.js`): EV fleet drivers with vehicle specifications and license data.
     9. `trips` (`models/Trip.js`): Dispatch consignments with crate checklists and verification PINs.
     10. `driverwallettransactions` (`models/DriverWalletTransaction.js`): Driver earnings ledger and UPI transfers.

4. **Multi-Tenant Authorization & Query Safety (Comprehension & Domain Boundaries)**:
   - Enforce strict tenant boundary checks: Farmer A cannot alter Farmer B's crops (HTTP 403); Driver A cannot inspect Driver B's dispatches.
   - Standardize query helpers to handle both human-readable domain IDs (`FMR-TN-2026-01`, `ORD-2026-8095`, `DRV-TN-2026-08`) and MongoDB ObjectIds without throwing unhandled `CastError` exceptions.

5. **Viva Defensibility & Demonstration Safety (Strategy)**:
   - Examiners and evaluators inspect MongoDB Compass directly. If a record is registered in the UI but does not appear in Compass due to in-memory mocks, the evaluation fails. True persistence guarantees consistency between the UI and Compass.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  - Standardize `backend/.env` with `MONGO_URI=mongodb://localhost:27017/naam-uzhavar`.
  - Add `backend/models/Invoice.js` to complete the 10-collection persistence model.
  - Delete all `IN_MEMORY_*` arrays and fallback mock writes in `backend/routes/`.
  - Add database connection middleware returning HTTP 503 when MongoDB is offline.
  - Update `backend/seed.js` to deterministically populate all 10 collections.
  - Remove silent `localStorage` fallback catches in frontend services (`src/services/cropService.js`).
  - Verify every mutation (Farmer harvest submit, Buyer order, Driver trip completion) updates the respective collection in MongoDB Compass.

* **Out-of-Scope Non-Goals:**
  - Migrating to MongoDB Atlas (the application remains strictly local per user directive).
  - Changing frontend CSS styling or layout architecture.
  - Replacing Mongoose with another database client.

## Alternatives Weighed

- **Dual-Mode (Memory + Database) Architecture**: Rejected by author. Silent fallbacks mask database errors, producing desynchronization between the UI and MongoDB Compass.
- **Client-Side Queueing (Offline Sync)**: Rejected. Introduces multi-client race conditions and conflict resolution complexity without adding value for a local server setup.
- **Fail-Fast Strict Mode (HTTP 503)**: Selected. Mutation attempts when the database is unreachable fail explicitly with actionable messages, preserving data integrity.

## Key Decisions & Staging for Next Steps

1. **Invoice Persistence**: Add `backend/models/Invoice.js` and persist invoices upon order completion rather than computing them in memory on demand.
2. **Hard Deletion of Mock Stores**: Remove `FALLBACK_CROPS`, `inMemoryFarmers`, `inMemoryBuyers`, `DEFAULT_DRIVER`, and `IN_MEMORY_TRIPS` from route files.
3. **Compass Verification**: Ensure `npm run seed` leaves all 10 collections visible with realistic records in MongoDB Compass at `mongodb://localhost:27017/naam-uzhavar`.
