# Hierarchy Processor – SRM Full Stack Engineering Challenge

A full-stack application that processes hierarchical node relationships and returns structured insights.

---

## 📁 Project Structure

```
Bajaj_Project/
├── backend/
│   ├── index.js          # Express API with full graph engine
│   ├── package.json      # Dependencies + scripts
│   └── node_modules/
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main React component + tree visualization
│   │   ├── App.css       # Layout & component styles
│   │   ├── index.css     # Global design system
│   │   └── main.jsx      # React entry point
│   ├── index.html        # HTML entry with SEO meta tags
│   ├── .env              # Local env vars
│   ├── .env.production   # Production env vars (update before deploy)
│   ├── vercel.json       # Vercel deployment config
│   └── vite.config.js    # Vite config
└── README.md
```

---

## ⚡ Local Setup

### Backend

```bash
cd backend
npm install
npm run dev       # development with nodemon
# OR
npm start         # production
```

Server starts at: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App opens at: `http://localhost:5173`

---

## 🌐 Deployment

### Backend → Render

1. Push your code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Copy your Render URL (e.g. `https://hierarchy-api.onrender.com`)

### Frontend → Vercel

1. Open `frontend/.env.production`
2. Replace the URL:
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com
   ```
3. Push to GitHub
4. Create a new project on [Vercel](https://vercel.com)
5. Set **Root Directory** to `frontend`
6. Click **Deploy** — Vercel auto-detects Vite

---

## 🔌 API Usage

### `POST /bfhl`

**Request:**
```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

**Response:**
```json
{
  "user_id": "john_doe_01012000",
  "email_id": "john.doe@college.edu",
  "college_roll_number": "ABCD123",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

---

## 🧪 Sample Test Cases

| Input | Notes |
|-------|-------|
| `["A->B", "A->C", "B->D"]` | Standard tree |
| `["A->B", "B->C", "C->A"]` | Cycle detection |
| `["A->B", "A->B"]` | Duplicate edges |
| `["A->A", "1->2", "hello"]` | Invalid entries |
| `["A->D", "B->D"]` | Multi-parent (B->D ignored) |
| `["A->B", "X->Y", "Y->X"]` | Mixed: one tree + one cycle |

---

## ✅ Processing Rules Implemented

- ✅ Input validation (regex: `X->Y`, single uppercase letters)
- ✅ Self-loop detection (`A->A` → invalid)
- ✅ Duplicate edges (first kept, rest in `duplicate_edges`)
- ✅ Multi-parent rule (first parent wins, later silently ignored)
- ✅ Weakly connected component grouping
- ✅ Root identification (no parent = root)
- ✅ Cycle detection (DFS with recursion stack)
- ✅ Tree construction (nested JSON)
- ✅ Depth calculation (longest root-to-leaf path)
- ✅ Tie-breaking by lexicographic order
- ✅ Summary with `total_trees`, `total_cycles`, `largest_tree_root`
