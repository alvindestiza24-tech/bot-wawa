// src/lib/security/license.js
export function getLicenseData() {
  const raw = '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'
  const token = raw.replace(/[^A-Za-z0-9_\-]/g, '')
  return {
    token: token,
    owner: 'kyyinfinite',
    repo: 'kyyinfinite'
  }
}

export function getLicenseToken() {
  return getLicenseData().token
}