# 👨‍🍳 Baron Kitchen OMS (Order Management System)

A next-generation, deeply scalable **Kitchen Display system** and **Order Management Hub** built natively for rapid food service execution. It effortlessly converts scrambled, messy text orders into highly structured, real-time ticket arrays synchronized across the cloud instantly.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)

## ✨ Core Features
*   **The Magic Parser Engine 🧠:** Simply paste unstructured messages (e.g., *"20 Thalis for Baron Kitchen - Kunal"*). The local regex engine accurately predicts quantities and isolates the client name cleanly formatting it into JSON.
*   **Real-Time Firebase Pipeline ⚡:** WebSockets via `onSnapshot` dynamically push new orders straight to the frontend pipeline millisecond-by-millisecond without page reloads.
*   **Kitchen Display System (KDS) 🧑‍🍳:** A massive, color-coded grid specifically engineered for the Head Chef. Highlights high-priority items and features a one-tap `Mark Ready` action.
*   **Native PDF Invoice Generator 🖨️:** Dynamically triggers a `.pdf` render of a fully branded cash receipt utilizing `window.print` mapping.
*   **Intelligent Dark Mode 🌗:** Fully reactive Tailwind architecture allowing instantaneous light-to-dark transitions depending on kitchen environment.

---

## 🚀 Live Demo Configuration

### 1. The Frontend (React/Vite)
Navigate to the frontend array and trigger rapid deployment securely connected to your Firebase configuration.
```bash
cd frontend
npm install
npm run dev
```

### 2. The Architecture (FastAPI & Pydantic)
*Only required if substituting Firebase with local SQL interactions.*
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📂 Architecture Structure
- `frontend/` - Bound via React + Vite. Features standard `<Dashboard />` components mapping natively to state variants.
- `backend/` - An isolated Python ecosystem parsing SQLAlchemy ORMs mapped tightly over local SQLite routing endpoints. 

---
*Built with ❤️ for Baron Kitchen Operations.*
