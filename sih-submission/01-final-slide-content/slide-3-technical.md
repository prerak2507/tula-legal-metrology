# SLIDE 3
Technical Approach

## Slide Copy
**Architecture:** Secure, modular, multi-tier application.
- **Frontend:** React + TypeScript + TailwindCSS (Progressive Web App for field offline use).
- **Backend / Database:** PostgreSQL (via Supabase) with Row-Level Security (RLS) for multi-tenant state isolation.
- **Workflow / Rule Engine:** Configurable JSON-based rule engine for state-specific Legal Metrology rules.
- **Trust Layer:** Asymmetric cryptography for certificate integrity and dynamic QR generation.

## Architecture
02-system-architecture.svg: Multi-layer diagram showing Client Layer (Web/PWA/Public) -> Gateway (Auth/RBAC) -> Application Services (Workflow, Rules, Certificate) -> Data Layer (PostgreSQL, Blob Storage, Audit Logs).

## Technologies
- **React/TypeScript:** Modular, typed, role-specific UI.
- **PostgreSQL/Supabase:** Scalable relational data with baked-in authorization policies (RLS).
- **Zustand/LocalForage:** For state management and offline syncing logic.

## Detailed Explanation
The architecture explicitly isolates business logic (state-specific rules) from core application code. The use of RLS ensures that a Controller in State A cannot access data for State B, making it viable for national scaling.

## Speaker Notes
"Our technical approach prioritizes security and offline-field readiness. We utilize React for a modular interface, backed by PostgreSQL. Crucially, we implement Row-Level Security to ensure strict data isolation across different jurisdictions."