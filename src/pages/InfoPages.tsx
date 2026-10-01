import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/layout/PublicHeader';
import { SiteFooter } from '../components/layout/SiteFooter';

const REPO = 'https://github.com/prerak2507/tula-legal-metrology';

const Page: React.FC<{ title: string; intro: string; children: React.ReactNode }> = ({ title, intro, children }) => {
  useEffect(() => { const prev = document.title; document.title = `${title} | TULA`; return () => { document.title = prev; }; }, [title]);
  return (
    <div className="min-h-screen w-full flex flex-col bg-paper-50 text-ink font-plex">
      <PublicHeader />
      <main id="main" className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="text-base text-ink-600 mt-3">{intro}</p>
        <div className="ruler text-brass/40 mt-6" aria-hidden="true" />
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink-700 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:underline [&_a]:font-semibold [&_a]:text-ink">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export const HelpPage: React.FC = () => (
  <Page title="Help" intro="How to use TULA, and who to contact.">
    <section>
      <h2>I bought something and the weight looks wrong</h2>
      <p>Scan the QR on the scale's certificate or seal with <Link to="/verify">Check a certificate</Link>. No login is needed. If the check says the certificate is fake, expired or revoked, tap "Report a problem" so the district office can inspect.</p>
      <p className="mt-2">For a consumer complaint, call the National Consumer Helpline on <strong>1915</strong> or contact your State Legal Metrology department. TULA is a prototype and does not receive real complaints.</p>
    </section>
    <section>
      <h2>I own a shop with a scale or fuel pump</h2>
      <ul>
        <li><Link to="/register">Register your business</Link>, add each instrument, and apply for verification or re-verification.</li>
        <li>The fee is worked out from your State's schedule. You are told by SMS / email at every step.</li>
        <li>Reminders come 30, 15, 7 and 1 days before a certificate expires.</li>
      </ul>
    </section>
    <section>
      <h2>I am evaluating the prototype</h2>
      <ul>
        <li>The <Link to="/demo">guided demo</Link> takes about five minutes, from registration to scanning a signed QR.</li>
        <li>On <Link to="/login">Sign in</Link>, one tap enters any of the six roles. All six share the password shown there.</li>
        <li><Link to="/status">Built vs planned</Link> lists exactly what is live and what is simulated.</li>
      </ul>
    </section>
    <section>
      <h2>Report a bug in the prototype</h2>
      <p>Open an issue on the <a href={REPO} target="_blank" rel="noreferrer">project's GitHub page</a>.</p>
    </section>
  </Page>
);

export const AccessibilityPage: React.FC = () => (
  <Page title="Accessibility statement" intro="TULA is built to follow the Guidelines for Indian Government Websites (GIGW 3.0) and WCAG 2.1 level AA. It has not yet been formally audited.">
    <section>
      <h2>What works today</h2>
      <ul>
        <li>Every page can be used with a keyboard, with a visible focus outline and a "Skip to main content" link.</li>
        <li>The bar at the top of each page sets text size (A−, A, A+) and high contrast. Your choice is remembered on your device.</li>
        <li>The public certificate check works in English and Hindi.</li>
        <li>Pages fit a 360-pixel phone screen, and buttons are at least 44 pixels tall for touch.</li>
        <li>Buttons, form fields and status messages carry labels for screen readers.</li>
      </ul>
    </section>
    <section>
      <h2>Known gaps</h2>
      <ul>
        <li>The signed-in portal is in English only. More Indian languages are planned for the pilot.</li>
        <li>Charts show their numbers in a legend next to them, but have no separate text description yet.</li>
      </ul>
    </section>
    <section>
      <h2>Tell us about a problem</h2>
      <p>If something does not work with your device or assistive technology, open an issue on <a href={REPO} target="_blank" rel="noreferrer">GitHub</a> and say which page and what you were trying to do.</p>
    </section>
  </Page>
);

export const PrivacyPage: React.FC = () => (
  <Page title="Privacy" intro="What the prototype stores, who can see it, and what is shared. Written with the Digital Personal Data Protection Act, 2023 in mind.">
    <section>
      <h2>Please do not enter real personal data</h2>
      <p>This is a hackathon prototype. The six evaluator accounts are shared by everyone who tries it.</p>
    </section>
    <section>
      <h2>What is stored</h2>
      <ul>
        <li>Account details: name, email, phone, business name and address.</li>
        <li>Instrument records, applications, uploaded documents, inspection readings, photos and GPS location of the inspection.</li>
        <li>An audit log of who did what and when.</li>
      </ul>
      <p className="mt-2">Data is kept in a managed Postgres database (Supabase). Database rules decide who can read each record: a trader sees only their own instruments, and an officer sees only their district or State.</p>
    </section>
    <section>
      <h2>What the public can see</h2>
      <p>The certificate check shows only what a buyer needs: the instrument, its owner's business name, place, validity and the verifying officer. No phone numbers or email addresses.</p>
    </section>
    <section>
      <h2>Shared with other services</h2>
      <ul>
        <li>Google Gemini: only the text of a question to the help assistant, or of an application an officer asks to pre-check. The AI never decides anything.</li>
        <li>Email and SMS providers: the message and the address or number it goes to, once those services are switched on.</li>
      </ul>
    </section>
    <section>
      <h2>In production</h2>
      <p>A State would host TULA on government cloud, appoint a grievance officer, and publish retention periods for each kind of record.</p>
    </section>
  </Page>
);

export const TermsPage: React.FC = () => (
  <Page title="Terms of use" intro="Plain terms for a prototype.">
    <section>
      <h2>No legal validity</h2>
      <p>Certificates, stamps and notices produced here are demonstrations. They are not issued under the Legal Metrology Act, 2009 and must not be relied on for trade.</p>
    </section>
    <section>
      <h2>Payments are simulated</h2>
      <p>The fee step records a demo UPI reference. No money is collected.</p>
    </section>
    <section>
      <h2>Not a government website</h2>
      <p>TULA was built by Team FriendlyFire for the Smart India Hackathon 2026, problem statement 26036 from the Department of Consumer Affairs. It is not run or endorsed by any government department.</p>
    </section>
    <section>
      <h2>Source code</h2>
      <p>The code is public on <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>.</p>
    </section>
  </Page>
);
