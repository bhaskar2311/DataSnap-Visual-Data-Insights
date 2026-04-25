# DataSnap — Visual Data Insights

> Turn any CSV file into beautiful, interactive charts — instantly, in your browser.

**Live Demo → [datasnap-visual-data-insights.vercel.app](https://datasnap-visual-data-insights.vercel.app)**

No account. No upload to any server. No data leaves your device.

---

## Features

### Upload & Parse
- Drag-and-drop or click-to-browse CSV upload
- CSV parsed entirely **in the browser** using PapaParse — instant, private, no server round-trip
- Supports files up to 50 MB
- Clear error messages for empty, wrong-type, or oversized files

### Data Configuration
- **Column selection** — pick any column as your X-axis (labels) and any as your Y-axis (values)
- **Live data preview** — see the first 5 rows of raw data before charting
- **Processed data preview** — see exactly what data will be charted after cleaning

### Data Cleaning
- Skip empty rows
- Skip non-numeric values
- Trim whitespace
- **Duplicate label handling** — Keep First, Sum, or Average per label
- Smart aggregation warning — detects when "Sum" is being applied to measurement columns (e.g. Age, Salary) and suggests switching to "Average"
- Min / Max value filters

### Smart Chart Suggestion Engine
- Click **"Suggest Best Chart"** to let the app analyse your data automatically
- Scores every column as a potential label or value axis
- Recommends the best chart type based on cardinality, data type, date detection, and label length
- Intelligently defaults duplicate strategy to Average for measurements, Sum for counts
- Shows confidence level (High / Medium / Low) and plain-English reasoning

### 9 Chart Types
| Chart | Best For |
|-------|----------|
| Bar | Comparing categories |
| Horizontal Bar | Many categories or long labels |
| Line | Trends over time |
| Area | Trends with magnitude emphasis |
| Stepped Line | Discrete step changes |
| Pie | Part-of-whole (≤ 8 categories) |
| Doughnut | Part-of-whole with centre space |
| Polar Area | Magnitude comparison in a radial layout |
| Radar | Multi-variable profile comparison |

### Customisation & Export
- **Color picker** — customise each category's color from a 20-color palette
- **Download chart as PNG**
- **Download cleaned dataset as CSV**
- **Download cleaned dataset as JSON**

### UI/UX
- Dark / Light theme toggle with OS preference detection and `localStorage` persistence
- Responsive layout — works on desktop and mobile
- 3-step progress indicator (Upload → Configure → Visualize)
- Informative empty states and error boundaries

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite |
| Charting | Chart.js 4, react-chartjs-2 |
| CSV Parsing | PapaParse (client-side) |
| Styling | Plain CSS with CSS variables (dark/light theming) |
| Deployment | Vercel |
| Backend (local dev) | Java 17, Spring Boot 3, Gradle, OpenCSV |

---

## Project Structure

```
DataSnap - Visual Data Insights/
├── frontend/                   ← React + Vite app (deployed on Vercel)
│   ├── public/
│   │   └── sample.csv          ← Sample data file
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx      ← Drag-and-drop upload + PapaParse
│   │   │   ├── DataConfigurator.jsx ← Column selection, cleaning, suggestion engine
│   │   │   ├── ChartDisplay.jsx    ← Chart rendering, color picker, downloads
│   │   │   └── ErrorMessage.jsx    ← Error display
│   │   ├── services/
│   │   │   └── api.js              ← (retained for local backend dev)
│   │   ├── App.jsx                 ← App shell, theme, step routing
│   │   ├── ErrorBoundary.jsx       ← React error boundary
│   │   └── index.css               ← Global styles + CSS variable theming
│   ├── vercel.json                 ← SPA routing config for Vercel
│   └── package.json
│
├── backend/                    ← Spring Boot Gradle project (local dev / future use)
│   ├── src/main/java/com/datasnap/
│   │   ├── controller/FileUploadController.java
│   │   ├── service/CSVProcessor.java
│   │   ├── model/ParsedCSVData.java
│   │   └── exception/GlobalExceptionHandler.java
│   ├── src/main/resources/
│   │   ├── application.properties  ← Port, multipart limits (50 MB)
│   │   └── sample.csv
│   ├── Dockerfile                  ← Docker image for cloud deployment
│   └── build.gradle
│
├── sample-data/
│   └── sample.csv
└── README.md
```

---

## Running Locally

### Frontend only (recommended)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — everything runs in the browser, no backend needed.

### Full stack (frontend + Spring Boot backend)

**Prerequisites:** Java 17+, Node.js 18+

```bash
# Terminal 1 — Backend
cd backend
./gradlew bootRun          # Linux / macOS
gradlew.bat bootRun        # Windows
# API available at http://localhost:8080

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Sample CSV

Any CSV with a header row works. Example:

```csv
Category,Sales
Electronics,4200
Clothing,3100
Food & Beverages,5800
Books,1500
Sports,2700
```

A ready-to-use sample is included at `sample-data/sample.csv` and can be downloaded directly from the app.

---

## Backend API (local dev)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload a CSV, returns all columns and raw rows as JSON |
| `GET` | `/api/sample` | Download the sample CSV file |

### Response — `POST /api/upload`

```json
{
  "columnNames": ["Category", "Sales", "Region"],
  "rows": [
    ["Electronics", "4200", "North"],
    ["Clothing", "3100", "South"]
  ]
}
```

---

## Deployment

| Service | What it hosts |
|---------|--------------|
| [Vercel](https://vercel.com) | Frontend (React/Vite static build) |
| [Render](https://render.com) *(optional)* | Backend (Docker — Java 17 + Spring Boot) |

The live demo runs frontend-only on Vercel. The backend Dockerfile is included for self-hosting or future cloud deployment.

---

## License

MIT License — free to use, modify, and distribute.

---

*Developed by **Bhaskar Shivaji Kumbhar***
