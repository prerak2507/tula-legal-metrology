# 02-system-architecture

```mermaid
graph LR
    subgraph Client Layer
        Web[Web Dashboards]
        Mobile[Offline PWA]
        Public[Public QR Scanner]
    end

    subgraph API & Gateway Layer
        Auth[Supabase Auth / RBAC]
        API[PostgREST API]
    end

    subgraph Application Services
        Rules[Configurable Rule Engine]
        Workflow[Workflow Manager]
        CertGen[Certificate Engine]
    end

    subgraph Data Layer
        DB[(PostgreSQL)]
        Blob[Document Storage]
        Audit[(Immutable Audit Log)]
    end

    Client Layer --> Auth
    Client Layer --> API
    API --> Rules
    API --> Workflow
    API --> CertGen
    Rules --> DB
    Workflow --> DB
    CertGen --> Blob
    DB --> Audit
```