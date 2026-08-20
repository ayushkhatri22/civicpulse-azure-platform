// CivicPulse — portfolio project entry
// Map these fields onto whatever shape src/data/content.js already uses.
// If your existing entries use different key names, keep yours and move the values across.

export const civicPulse = {
  id: "civicpulse",
  title: "CivicPulse",
  subtitle: "Civic Incident Data Platform",
  category: "Cloud Data Engineering",
  year: "2026",

  // One line for the project grid / card view
  tagline:
    "A serverless Azure platform that ingests council incident reports, de-identifies them in the pipeline, and publishes an aggregate-only public dashboard.",

  // Two or three sentences for the project detail header
  summary:
    "A small Victorian council needs to show residents what is being reported and resolved — without ever exposing the personal information those reports contain. CivicPulse validates every incoming record against six rules, strips sensitive fields before they can travel downstream, and publishes a single pre-computed JSON file that a static site renders. The council's binding constraint is attention, not budget, so every control is enforced by the platform rather than by vigilance.",

  // The one thing worth remembering about this project
  highlight:
    "Privacy is structural, not procedural. The source file has nine columns; the pipeline reads six. Description and coordinates are never referenced, so no front-end change can expose them.",

  stack: [
    "Azure Logic Apps",
    "ADLS Gen2",
    "Azure Static Website",
    "Entra ID / RBAC",
    "Azure Policy",
    "JavaScript",
  ],

  // Numbers give the card something concrete to show
  metrics: [
    { label: "Validation rules", value: "6" },
    { label: "Storage zones", value: "6" },
    { label: "Test run", value: "60 read · 55 valid · 5 rejected" },
    { label: "Trigger latency", value: "< 1 min" },
  ],

  // Short, scannable — these are what a recruiter actually reads
  contributions: [
    "Designed a six-container storage topology where each zone carries exactly one data classification, so the applicable control follows from location rather than judgement.",
    "Built a Logic App pipeline with blob-triggered ingestion, six-rule row validation, field-level de-identification, and runtime aggregation using union expressions so new categories appear without code changes.",
    "Quarantined failing rows with their original text and failure reason rather than discarding them, making data incompleteness countable and correctable.",
    "Proved the validation layer with a purpose-built defect file — one defect per rule — and reconciled output against figures calculated from the source beforehand.",
    "Implemented governance as enforced policy: CAF naming, four mandatory tags with a Deny effect, RBAC at container scope, and a system-assigned managed identity so no key exists to leak.",
    "Built the public dashboard as a static site with loading, error and empty states, semantic headings, a text alternative for the chart, and single-column reflow on mobile.",
  ],

  links: [
    {
      label: "Live dashboard",
      url: "https://stcivicpulseprodaue001.z8.web.core.windows.net/",
      primary: true,
    },
    {
      label: "Source",
      url: "https://github.com/khatriayush123-cloud/civicpulse-bus5001",
    },
  ],

  images: [
    { src: "/projects/civicpulse/dashboard-kpis.png", alt: "CivicPulse dashboard KPIs and incidents-by-category chart", featured: true },
    { src: "/projects/civicpulse/architecture.png", alt: "End-to-end Azure architecture, private estate through to public surface" },
    { src: "/projects/civicpulse/containers.png", alt: "Six-container storage topology in Azure Storage" },
    { src: "/projects/civicpulse/audit-log.png", alt: "Per-run audit record showing 60 read, 55 valid, 5 rejected" },
  ],
};
