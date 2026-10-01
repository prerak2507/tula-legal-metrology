// Every official document TULA's rules and reference data come from. One list, used by the rules
// engine (citations), the Sources page, the certificate and the deck. Links were checked on 1 Oct 2026.

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  official: boolean;        // published by a government body or OIML; false = secondary copy of the text
  usedFor: string;
}

export const SOURCES: Record<string, Source> = {
  LM_ACT: {
    id: 'LM_ACT', title: 'The Legal Metrology Act, 2009', publisher: 'Government of India (copy hosted by the Controller of Legal Metrology, Gujarat)',
    url: 'https://lmdca.gujarat.gov.in/clmdca/documents/the-legal-metrology-act-2009.pdf', official: true,
    usedFor: 'Verification duty (section 24), model approval (section 22), offences and compounding (section 48)',
  },
  DL_ENF: {
    id: 'DL_ENF', title: 'Delhi Legal Metrology (Enforcement) Rules, 2011', publisher: 'Weights & Measures Department, Government of NCT of Delhi',
    url: 'https://weightnmeasures.delhi.gov.in/sites/default/files/inline-files/delhi_legal_metrology_enforcement_rules_2011_english.pdf', official: true,
    usedFor: 'Certificate format (Schedule VIII), fees (Schedule IX), on-site and late fees (rule 16), quarter marks (rule 15), compounding fees (Schedule XI)',
  },
  DL_FAQ: {
    id: 'DL_FAQ', title: 'Weights & Measures Department, Delhi: FAQs (Manual 17)', publisher: 'Weights & Measures Department, Government of NCT of Delhi',
    url: 'https://weightnmeasures.delhi.gov.in/sites/default/files/inline-files/w_m_manual_17-faqs.pdf', official: true,
    usedFor: 'Validity period of each kind of instrument; certificate to be displayed at the premises',
  },
  GJ_FEES: {
    id: 'GJ_FEES', title: 'Fee structure for verification and stamping', publisher: 'Controller of Legal Metrology and Director Consumer Affairs, Government of Gujarat',
    url: 'https://lmdca.gujarat.gov.in/en/fee-structure', official: true,
    usedFor: 'Gujarat verification fees (Schedule IX of the Gujarat Enforcement Rules)',
  },
  GJ_ENF: {
    id: 'GJ_ENF', title: 'Gujarat Legal Metrology (Enforcement) Rules, 2011', publisher: 'Controller of Legal Metrology and Director Consumer Affairs, Government of Gujarat',
    url: 'https://lmdca.gujarat.gov.in/clmdca/documents/the-legal-metrology-enforcement-rules-2011.pdf', official: true,
    usedFor: 'Gujarat rules text (scanned copy)',
  },
  GR_2011: {
    id: 'GR_2011', title: 'Legal Metrology (General) Rules, 2011, rule 27 (text)', publisher: 'Indian Kanoon (secondary copy of the notified rules)',
    url: 'https://indiankanoon.org/doc/67045693/', official: false,
    usedFor: 'Re-verification periods: 24 months for weights, measures, beam scales and counter machines; 12 months for other instruments',
  },
  MODEL_APPROVAL: {
    id: 'MODEL_APPROVAL', title: 'Model Approval certificates register', publisher: 'Legal Metrology Division, Department of Consumer Affairs',
    url: 'https://lm.doca.gov.in/modelapproval/Certificates.aspx', official: true,
    usedFor: 'Checking an instrument’s approval mark (IND/09/yy/nnn); 10,050 entries, 2011 to 2026',
  },
  OIML_R76: {
    id: 'OIML_R76', title: 'OIML R 76-1: Non-automatic weighing instruments', publisher: 'International Organization of Legal Metrology',
    url: 'https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf', official: true,
    usedFor: 'Maximum permissible errors for scales (0.5e, 1e, 1.5e bands), as adopted in the General Rules',
  },
  OIML_R117: {
    id: 'OIML_R117', title: 'OIML R 117-1: Dynamic measuring systems for liquids other than water', publisher: 'International Organization of Legal Metrology',
    url: 'https://www.oiml.org/en/files/pdf_r/r117-1-e19.pdf', official: true,
    usedFor: 'Maximum permissible error for fuel dispensers (0.5 % for accuracy class 0.5)',
  },
  DOCA_LM: {
    id: 'DOCA_LM', title: 'Legal Metrology overview', publisher: 'Department of Consumer Affairs, Government of India',
    url: 'https://consumeraffairs.gov.in/pages/legal-metrology-overview', official: true,
    usedFor: 'Roles of the Centre and States; Government Approved Test Centres',
  },
  NCH: {
    id: 'NCH', title: 'National Consumer Helpline (1915)', publisher: 'Department of Consumer Affairs, Government of India',
    url: 'https://consumerhelpline.gov.in/', official: true,
    usedFor: 'Where a buyer can complain',
  },
};

export const source = (id: keyof typeof SOURCES) => SOURCES[id];
