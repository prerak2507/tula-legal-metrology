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
    usedFor: 'Certificate format (Schedule VIII), fees (Schedule IX), on-site and late fees (rule 16), quarter marks (rule 15). its Schedule XI was replaced in Jan 2026 (next entry)',
  },
  DL_ENF_2026: {
    id: 'DL_ENF_2026', title: 'Delhi Legal Metrology (Enforcement) Amendment Rules, 2026 (new Schedule XI)', publisher: 'Weights & Measures Department, Government of NCT of Delhi (Delhi Gazette, 28 Jan 2026)',
    url: 'https://weightnmeasures.delhi.gov.in/sites/default/files/inline-files/gazette_notification_3.pdf', official: true,
    usedFor: 'Compounding fees: item 11 (unverified weight or measure used, section 33) ₹10,000; item 17 (contravention of any rule, section 53(3)) ₹5,000',
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
  GR_27: {
    id: 'GR_27', title: 'Re-verification periods, rule 27 of the Legal Metrology (General) Rules, 2011', publisher: 'Food, Civil Supplies & Consumer Affairs Department, Government of Assam',
    url: 'https://fcsca.assam.gov.in/information-services/re-verification-weights-measures-0', official: true,
    usedFor: 'Validity: 24 months for weights, measures, beam scales and counter machines; 60 months for storage tanks; 12 months for all others',
  },
  GR_2011: {
    id: 'GR_2011', title: 'Legal Metrology (General) Rules, 2011, rule 27 (text)', publisher: 'Indian Kanoon (secondary copy of the notified rules)',
    url: 'https://indiankanoon.org/doc/67045693/', official: false,
    usedFor: 'Re-verification periods: 24 months for weights, measures, beam scales and counter machines; 12 months for other instruments',
  },
  GR_SPECS: {
    id: 'GR_SPECS', title: 'Legal Metrology (General) Rules, 2011: instrument specifications', publisher: 'Department of Consumer Affairs',
    url: 'https://consumeraffairs.gov.in/pages/legal-metrology-overview', official: true,
    usedFor: 'Error limits for pass / fail: the Seventh Schedule (weighing) and Eighth Schedule (measuring, including fuel dispensers) set them, based on OIML R 76 and R 117',
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

export const LEGAL_LINKS: { label: string; url: string; note?: string }[] = [
  { label: 'Legal Metrology Act, 2009', url: SOURCES.LM_ACT.url },
  { label: 'General Rules, 2011 (rule 27)', url: SOURCES.GR_27.url },
  { label: 'Delhi Enforcement Rules, 2011', url: SOURCES.DL_ENF.url },
  { label: 'Delhi Schedule XI, amended 2026', url: SOURCES.DL_ENF_2026.url },
  { label: 'GATC Rules, 2013 (DoCA)', url: SOURCES.DOCA_LM.url },
  { label: 'OIML R 76', url: SOURCES.OIML_R76.url },
  { label: 'OIML R 117', url: SOURCES.OIML_R117.url },
];
