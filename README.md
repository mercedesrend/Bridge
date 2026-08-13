# PrepDoc

PrepDoc is a mobile-first patient-visit preparation tool built for the **AWS Biopharma Hack Day**. It helps people turn a diagnosis or treatment concern into a clearer, more productive conversation with their care team.

The app is designed around the three moments of a doctor visit:

- **Before:** describe a health situation, review sourced treatment information, and build a focused list of questions.
- **During:** work through one question at a time, record notes, and mark what was answered or still needs follow-up.
- **After:** review the visit, identify unanswered questions, and generate concrete next steps to discuss with the care team.

PrepDoc is an informational preparation aid, not a diagnostic tool or a substitute for professional medical advice. It does not make treatment decisions or determine clinical-trial eligibility.

## Why this project

Biopharma decisions can involve unfamiliar terminology, multiple treatment paths, and limited time during an appointment. PrepDoc brings trustworthy public information and a structured conversation workflow together in one place, so patients can arrive prepared and leave with a clearer record of what to do next.

## Features

- Free-text patient-profile intake with AI-assisted profile parsing
- Plain-language treatment summaries based on retrieved source material
- References to public health information from openFDA, ClinicalTrials.gov, and MedlinePlus
- Treatment questions that can be selected, customized, answered, skipped, and annotated
- Visit notes that persist locally in the browser
- Shareable, read-only recap links encoded in the URL
- AI-generated follow-up suggestions after the visit
- Demo-patient prefill for quickly exploring the experience

## Tech stack

- Next.js 15 with the App Router
- React 19 and TypeScript
- Tailwind CSS v4
- OpenAI-compatible API client, supporting OpenRouter or OpenAI
- No application database; visit state is stored in browser `localStorage` and shareable URL state

## Project structure

```text
app/
  api/                 Server routes for profile parsing, options, and recap actions
  prep/                Treatment preparation workflow
  visit/               During-visit question and note-taking workflow
  recap/               Post-visit recap and sharing workflow
components/            Client-side workflow and UI components
lib/                   Types, retrieval helpers, state utilities, and LLM integrations
TrialLens/             Related clinical-trial exploration prototype
```

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add an API key to `.env.local`. The app accepts either `OPENROUTER_API_KEY` or `OPENAI_API_KEY`:

   ```bash
   OPENROUTER_API_KEY=your_key_here
   OPENAI_MODEL=openai/gpt-4.1-nano
   ```

   Keep `.env.local` private and never commit API keys to source control.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and use the demo-patient option to explore the workflow.

## Available scripts

```bash
npm run dev       # Start the Next.js development server
npm run typecheck # Run the TypeScript compiler without emitting files
npm run build     # Create a production build
npm run start     # Start the production server
```

Do not run `npm run build` while `next dev` is running because both commands use the same `.next` directory.

## Data and AI behavior

Public health and clinical-trial information is retrieved from openFDA, ClinicalTrials.gov, and MedlinePlus. The language model is used for structured profile extraction, plain-language rewriting, and recap suggestions. The application is instructed not to invent medical facts, introduce treatments absent from source material, or present uncertainty as a definitive recommendation.

Always verify information and decisions with a qualified healthcare professional.

## Hackathon context

This project was created as a submission for the **AWS Biopharma Hack Day**, exploring how AI, public biomedical data, and thoughtful patient-centered workflows can improve preparation for conversations about care.
