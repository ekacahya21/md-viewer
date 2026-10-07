# Security Policy

MD Viewer takes the security and privacy of its users very seriously. This document outlines our vulnerability disclosure process and supported versions.

---

## 🛡️ Supported Versions

We actively provide security patches and updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within MD Viewer, please **do not open a public issue**. Disclosing vulnerabilities publicly puts active deployments and users at risk.

Instead, please report security concerns via one of the following methods:

1. **GitHub Private Security Advisory:**  
   Go to the [MD Viewer Security Advisories](https://github.com/ekacahya21/md-viewer/security/advisories) tab and click **"Report a vulnerability"**.
2. **Direct Email:**  
   Send an encrypted or private email to the maintainer at `security@e21.dev` or directly to `ekacahya21` via GitHub.

### What to Include in Your Report:
- A descriptive summary of the vulnerability (e.g. XSS, Denial of Service, SSRF).
- Clear, reproducible steps or a minimal Proof of Concept (PoC).
- The affected component, file, or endpoint.
- An assessment of the impact on users or self-hosted instances.

### Our Commitment:
- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will provide a triage assessment and estimated fix timeline.
- Once a fix is verified, a patched release will be published and credit will be given in release notes (unless anonymity is requested).

---

## 🔒 Security Best Practices for Self-Hosters

When self-hosting MD Viewer in production:
- Ensure HTTPS/TLS is configured (e.g. via Caddy, Nginx, or Traefik reverse proxy).
- Keep Docker containers updated to the latest release tag.
- Mount the `/data` volume securely with appropriate Linux file ownership (`chown -R 1000:1000 data`).
- Configure a strong `VIEW_SALT` environment variable if self-hosting publicly.
