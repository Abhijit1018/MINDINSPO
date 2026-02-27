Product Requirements Document (PRD): Idea Incubator & Catalog
1. Overview & Goals
The Idea Incubator is a web application designed to act as a structured "Second Brain." It allows users to input raw ideas, tool names, or concepts. The system then automatically researches, expands, and visually categorizes these inputs into a rich, interactive catalog format containing text, workflow diagrams, and conceptual images.

Core Objectives:

Provide a seamless input interface for fleeting ideas.

Automate the research and structuring of raw inputs into actionable intelligence.

Render interactive visualizations (Mermaid.js flowcharts) and images for every generated catalog entry.

2. Tech Stack
Frontend: React (with Tailwind CSS for styling, mermaid or react-mermaid2 for diagrams).

Backend: Python (Django or Flask) for API routing, database management, and n8n webhook triggering.

Database: PostgreSQL for structured relational data.

Automation/Research Engine: n8n.

AI Integration: OpenAI/OpenRouter (for text and Mermaid generation), DALL-E 3/Stable Diffusion (for image generation).

3. Core Features & Functional Requirements
3.1 Idea Ingestion
The user must have a persistent, accessible input field (e.g., a modal or a floating action button) to submit a text prompt.

Upon submission, the frontend sends a POST request to the Python backend.

The backend saves a database record with a status: "pending" and returns a success response to the frontend to prevent UI blocking.

3.2 Automated n8n Research Pipeline
The Python backend triggers an n8n webhook containing the user's raw idea.

n8n orchestrates the AI logic to return a structured JSON response containing:

summary: A detailed explanation of the idea/tool.

tech_stack: Recommended tools and frameworks.

pros_cons: Bulleted advantages and limitations.

similar_tools: Top 3 alternatives currently in the market.

mermaid_syntax: Valid Mermaid.js syntax mapping out the architecture or workflow.

image_url: A generated image representing the concept.

3.3 Dynamic Catalog Rendering
The frontend fetches catalog entries from the backend API.

Catalog cards must display the summary, tech_stack, and similar_tools in a clean, readable layout.

The frontend must dynamically parse the mermaid_syntax string and render it as an interactive diagram.

The frontend must display the conceptual image fetched from the image_url.

4. Database Schema Requirements
JSON
{
  "User": {
    "id": "uuid",
    "email": "string",
    "created_at": "timestamp"
  },
  "CatalogEntry": {
    "id": "uuid",
    "user_id": "uuid",
    "raw_input": "string",
    "status": "string",
    "summary": "text",
    "tech_stack": "jsonb",
    "pros_cons": "jsonb",
    "similar_tools": "jsonb",
    "mermaid_syntax": "text",
    "image_url": "string",
    "tags": "array",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
5. API Endpoints (Python Backend)
POST /api/ideas/submit: Receives raw text from React, creates a pending database row, triggers n8n webhook.

GET /api/catalogs/: Returns paginated catalog entries for the user.

POST /api/webhooks/n8n-callback: The endpoint n8n calls to deliver the finalized JSON payload to update the database row from pending to completed.