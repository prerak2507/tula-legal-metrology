// Public keys that TULA trusts for certificate signatures.
// Adding a key here (and its private half to the server env) is how keys are rotated:
// old certificates keep verifying against their kid, new ones use the new kid.
// Public keys are safe to publish. Private keys never enter this repository.

export interface TrustedKey {
  kid: string;
  label: string;
  /** Demo keys are used by the public prototype, where anyone can act as an officer. */
  demo: boolean;
  validFrom: string;
  jwk: JsonWebKey;
}

export const TRUSTED_KEYS: TrustedKey[] = [
  {
    kid: 'tula-demo-2026-09',
    label: 'TULA prototype issuing key (demo)',
    demo: true,
    validFrom: '2026-09-30',
    jwk: {
      kty: 'EC',
      crv: 'P-256',
      x: 'hTRn1vTUpKp4BJAhJXPTBVNweRHz8G2aVPP3e3Q8oRc',
      y: '4mf0AzTo8A6_eeGlEkf2Ar3cNMLqPlCHn8yt6GnSZtE',
    },
  },
];

export const findTrustedKey = (kid: string) => TRUSTED_KEYS.find(k => k.kid === kid);
