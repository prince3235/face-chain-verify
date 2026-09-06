# 🚀 Deployment Guide: Vercel (Frontend) + Render (Backend)

This guide walks you through deploying **Face-Chain-Verify** completely **FREE** with zero monthly costs using:
- **Backend (Python / FastAPI / OpenCV)**: Hosted on **[Render.com](https://render.com)** (Free Web Service)
- **Frontend (Next.js / Tailwind CSS)**: Hosted on **[Vercel](https://vercel.com)** (Free Hobby Tier)

---

## 📋 Architecture Overview

```
[User Browser]
       │
       ▼
[Vercel - Next.js Frontend]
  (UI, Image Upload, Pipeline Stepper)
       │
       ▼ Server-to-Server (/api/*)
[Render - FastAPI Backend]
  ├── Face Detection & 128-d Embedding (OpenCV)
  ├── Reverse Image Search (Google Lens / Consented Registry)
  └── Blockchain Anchoring (Polygon Testnet / Simulated Ledger)
```

---

## 🛠️ Step 1: Deploy Backend on Render (Free)

Render natively runs Python Web Services with free SSL, automatic CI/CD on git push, and zero configuration.

### Option A: 1-Click Blueprint (Recommended)
1. Push this repository to your GitHub: `https://github.com/prince3235/face-chain-verify`.
2. Go to **[Render Dashboard](https://dashboard.render.com/)** and log in with GitHub.
3. Click **New +** ➡️ **Blueprint**.
4. Connect your `face-chain-verify` repository.
5. Render will automatically read [`render.yaml`](./render.yaml) and configure everything.
6. Click **Apply**.

### Option B: Manual Web Service Setup
1. Go to **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** ➡️ **Web Service**.
3. Select `prince3235/face-chain-verify`.
4. Configure the settings:
   - **Name**: `face-chain-verify-api`
   - **Region**: `Oregon (US West)` or nearest to you
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `CHAIN_MODE` = `simulate`
   - `WEB_SEARCH_ENABLED` = `true`
   - `CORS_ORIGINS` = `*`
6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to finish. Once live, copy your backend URL:
   `https://face-chain-verify-api.onrender.com`

---

## ⚡ Step 2: Deploy Frontend on Vercel (Free)

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)** and log in with GitHub.
2. Click **Add New...** ➡️ **Project**.
3. Locate `face-chain-verify` and click **Import**.
4. In the configuration screen:
   - **Framework Preset**: `Next.js` (default)
   - **Root Directory**: Click **Edit** and choose `frontend`.
5. Expand **Environment Variables** and add:
   - **Name**: `BACKEND_URL`
   - **Value**: `https://<YOUR-RENDER-BACKEND-NAME>.onrender.com` (from Step 1)
6. Click **Deploy**.
7. In ~1 minute, Vercel will give you a public URL (e.g. `https://face-chain-verify-prince.vercel.app`).

---

## 🔍 Verification & Health Check

1. **Test Backend**: Visit `https://<YOUR-RENDER-BACKEND>.onrender.com/health`.
   - Expected response: `{"status": "ok", "chain_mode": "simulate"}`
2. **Test Frontend**: Open your Vercel URL.
   - Upload any face photo.
   - Watch the 3-step pipeline run:
     1. Face Detection & Embedding extraction
     2. Google Lens / Consented Registry search
     3. SHA-256 Blockchain anchoring & verification badge

---

## 💡 Notes for Free Tier
- **Render Free Tier Spin-Down**: Free instances on Render spin down after 15 minutes of inactivity. When a user visits the app after a pause, the first request may take ~30-45 seconds while Render boots up the container. Subsequent requests are instant.
