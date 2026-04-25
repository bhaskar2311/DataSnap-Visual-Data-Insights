# DataSnap - Visual Data Insights

An open-source, web-based educational tool that lets you upload a CSV file and instantly generate **bar and pie charts** from your data — no account, no data storage.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Chart.js, react-chartjs-2, Axios |
| Backend | Java 17, Spring Boot 3, Gradle |
| CSV Parsing | OpenCSV 5.9 |
| Communication | REST / JSON |

## Project Structure

```
DataSnap - Visual Data Insights/
├── backend/          ← Spring Boot Gradle project
├── frontend/         ← React + Vite app
├── sample-data/      ← Sample CSV for testing
└── README.md
```

## Prerequisites

- **Java 17+** — [Download](https://adoptium.net/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/DataSnap-Visual-Data-Insights.git
cd "DataSnap - Visual Data Insights"
```

### 2. Start the Backend

```bash
cd backend
./gradlew bootRun        # Linux / macOS
gradlew.bat bootRun      # Windows
```

The API will be available at `http://localhost:8080`.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload a CSV file, returns chart data as JSON |
| `GET` | `/api/sample` | Download the sample CSV file |

### Request — `POST /api/upload`

- Content-Type: `multipart/form-data`
- Field name: `file`
- Constraints: `.csv` files only, max **1 MB**

### Response — 200 OK

```json
{
  "labels": ["Electronics", "Clothing", "Food & Beverages"],
  "values": [4200, 3100, 5800],
  "columnNames": ["Category", "Value"]
}
```

### Error Response

```json
{
  "message": "Invalid file type. Only .csv files are accepted.",
  "code": 415
}
```

## Sample CSV Format

The CSV must have at least **two columns**: a label column and a numeric value column.

```csv
Category,Value
Electronics,4200
Clothing,3100
Food & Beverages,5800
Books,1500
Sports,2700
```

A ready-to-use sample is included at `sample-data/sample.csv` and can also be downloaded via the app.

## Features

- Drag-and-drop or click-to-browse CSV upload
- Instant bar and pie chart generation
- Toggle between bar, pie, or both views side-by-side
- Inline data summary table
- Download sample CSV to try the tool right away
- Informative error messages for invalid files
- No data persistence — files processed in-memory only

## License

MIT License — see [LICENSE](LICENSE) for details.
