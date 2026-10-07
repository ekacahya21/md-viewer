# Contributing to MD Viewer

Thank you for your interest in contributing to **MD Viewer**! We welcome bug fixes, documentation improvements, new features, and feedback from the community.

---

## 🛠️ Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v22.5+ (requires native `node:sqlite` DatabaseSync)
- [Git](https://git-scm.com/)
- Optional: [Docker](https://www.docker.com/)

### Getting Started

1. **Fork and Clone the Repository:**
   ```bash
   git clone https://github.com/<your-username>/md-viewer.git
   cd md-viewer
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(The app works out of the box with zero external configuration. If you wish to enable the optional AI summarizer, configure your OpenAI-compatible endpoint in `.env`).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 🧪 Testing & Verification

Before submitting a Pull Request, please ensure all checks pass:

1. **Lint Code:**
   ```bash
   npm run lint
   ```

2. **Type Check:**
   ```bash
   npx tsc --noEmit
   ```

3. **Run Automated Test Suite:**
   ```bash
   npm test
   ```

4. **Verify Production Build:**
   ```bash
   npm run build
   ```

---

## 🌿 Branching Strategy & Git Workflow

- **Default Branch:** `main`
- **Feature Branches:** Use descriptive names like `feat/mermaid-zoom`, `fix/mobile-table-scroll`, or `docs/update-readme`.
- **Commit Messages:** Follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: add export to docx`
  - `fix: prevent layout shift on KaTeX rendering`
  - `docs: improve contributing instructions`
  - `test: add unit test for sanitizeMarkdown`

---

## 📬 Submitting a Pull Request (PR)

1. Push your branch to your forked repository.
2. Open a Pull Request against the `main` branch.
3. Fill out the PR template completely (context, changes made, testing done, screenshots if UI-related).
4. Ensure all GitHub Actions CI checks pass.

Thank you for helping make MD Viewer better for everyone!
