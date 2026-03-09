## Security Policy

ASCII Lab is a client-side web application that generates ASCII art. While the security surface is relatively small, we still treat security seriously.

### Supported versions

This is a single-page app; there is no formal version matrix. The **`main` branch** and the most recent tagged release (if any) are considered supported.

### Reporting a vulnerability

- **Do not** create a public GitHub issue for sensitive security reports.
- Instead, please:
  - Use GitHub’s private security advisories feature if available on this repository, **or**
  - Contact the project maintainer via a private channel (for example, email listed on their GitHub profile) with:
    - A clear description of the issue.
    - Steps to reproduce, including any payloads needed.
    - The environment in which you reproduced it (browser, OS, etc.).

We aim to:

- Acknowledge receipt of your report as quickly as possible.
- Investigate, prioritize, and fix valid issues.
- Credit reporters in release notes if they wish.

### Scope

In scope:

- Client-side security of the ASCII Lab web application:
  - Cross-site scripting (XSS) or HTML injection in user-visible output.
  - Leakage of sensitive environment variables into the client bundle.
  - Abuse vectors that allow unexpected network requests from the browser.

Out of scope:

- Issues exclusively affecting third-party services or dependencies that we do not control.
- Social engineering or non-technical attacks.

### Dependency security

- This project relies on a small set of well-known open‑source dependencies (React, Vite, Tailwind, etc.).
- We recommend:
  - Running `npm audit` periodically.
  - Keeping dependencies reasonably up to date.

If you discover a vulnerability in a dependency that directly affects ASCII Lab’s security posture, please include that detail in your report so we can evaluate and respond appropriately.

