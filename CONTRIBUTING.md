## Contributing to ASCII Lab

Thank you for your interest in contributing to ASCII Lab. This document describes how to work with the project in a consistent, professional way.

### How to propose changes

- **Small fixes** (typos, copy tweaks, minor UI adjustments):
  - Fork the repo (or create a branch if you have write access).
  - Make your change.
  - Open a pull request (PR) with a short, descriptive title.

- **Larger changes** (new features, significant refactors):
  - Consider opening an issue first to discuss your idea.
  - Outline the problem, the proposed solution, and any trade‑offs.
  - Once aligned, follow the workflow below.

### Development workflow

1. Fork the repo / create a feature branch from `main`.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Make your changes, keeping commits logically grouped and well-described.
5. Before opening a PR, ensure:

   ```bash
   npm run lint
   npm run build
   ```

   both succeed locally.

### Coding guidelines

- **TypeScript & React**
  - Prefer typed props and state; avoid using `any`.
  - Keep components focused; if something grows large/complex, consider extracting smaller components or hooks.
  - Avoid unnecessary global state; favor local component state where appropriate.

- **Styling**
  - Use Tailwind classes and the existing utility approach (`clsx`, `tailwind-merge`) instead of ad‑hoc inline styles.
  - Preserve the existing terminal / cyber aesthetic unless a design change is clearly intentional and described in the PR.

- **Accessibility**
  - Use semantic HTML where possible.
  - Provide `aria-` attributes and labels when adding interactive elements.
  - Ensure keyboard navigation continues to work (e.g. don’t trap focus).

### Commit and PR best practices

- Keep commits **small and focused**, each addressing a single concern when possible.
- Write clear commit messages that explain the “why”, not just the “what”.
- For PRs:
  - Use a descriptive title (e.g. “Improve mobile font picker UX”).
  - In the description, include:
    - What changed.
    - Why it was needed.
    - How you tested it (commands, browsers, devices).

### Security considerations

- Do not commit secrets or private keys. `.env` files are intentionally excluded from version control (see `.env.example` for safe defaults).
- Review [`SECURITY.md`](./SECURITY.md) before working on features that might impact security (e.g. new inputs, external requests).

### Code of conduct

Be respectful and constructive in all interactions. Disagreements happen, but we handle them with professionalism and empathy.

By participating in this project you agree to:

- Be welcoming and inclusive.
- Provide kind, actionable feedback.
- Avoid personal attacks or harassment of any kind.

Maintainers may moderate discussions and contributions that violate these principles.

