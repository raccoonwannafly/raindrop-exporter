# Raindrop Exporter
Web application to export your Raindrop.io collections and bookmarks into various formats (JSON, HTML, CSV, XML).
Live at: https://raindrop-exporter.vercel.app/
<img width="1266" height="638" alt="image" src="https://github.com/user-attachments/assets/c1856291-0796-4d3f-87c1-cef070cf3d86" />


## Features
- **Selective Export**: Choose specific collections or individual bookmarks to export.
- **Multiple Formats**: Export to Netscape HTML (for browser import), JSON, CSV, and XML.
- **Dark Mode**: Fully responsive UI with dark/light mode support.
- **Tree View**: Hierarchical view of your Raindrop collections.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A Raindrop.io account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file (optional):
   ```bash
   cp .env.example .env.local
   ```

### Running Locally

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Obtain a "Test Token" from [Raindrop.io Settings > Integrations](https://app.raindrop.io/settings/integrations).
4. Enter the token in the application to start exporting.

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS (CDN), Lucide React (Icons)
- **Deployment**: Ready for Vercel, Netlify, or GH Pages.

## License

This project is licensed under the MIT License.
