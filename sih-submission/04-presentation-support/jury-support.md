# Presentation Support

## Speaker Notes
(See individual slide markdown files for slide-specific notes.)

## Jury Objections & Answers

**Objection:** "Many states already have e-governance portals for this. Why build another?"
**Answer:** "Existing systems are primarily document-submission portals. TULA is an instrument lifecycle platform. We provide an abstracted rule engine allowing national deployment, plus live QR verification and offline field capabilities that legacy systems lack."

**Objection:** "How do you handle rural inspections with no internet?"
**Answer:** "The application uses a Progressive Web App (PWA) architecture with a background sync queue (syncQueue.ts). LMOs record observations offline, and the data syncs automatically upon regaining connectivity."

**Objection:** "Are you actually generating secure PDFs?"
**Answer:** "In the prototype, we demonstrate client-side generation for speed. In production, certificates will be generated server-side and cryptographically signed to prevent tampering."