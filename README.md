# Finly 🌡️
Finly (formerly "Meu Termômetro Financeiro") is a full-stack personal finance web app. It started as an academic MVP project and has since grown into a fully self-hosted app — a simple, clear replacement for complex spreadsheets.

The core value proposition hasn't changed: give the user immediate clarity on income and expenses, with as little friction as possible.

## 🎯 The Problem
Many people try to manage their finances with spreadsheets, but find the process complex, manual, and hard to use on mobile. This leads to giving up, which brings a lack of clarity and financial stress.

## ✨ The Solution
A full-stack web app that lets the user:
- Sign up and log in securely (JWT-based auth).
- Manage a personal set of categories (emoji, colour, income/expense type) and tag transactions with them.
- Log income and expenses quickly, organized by category.
- See an immediate dashboard with the balance (income vs. expenses) and a spending-by-category chart.
- Set savings goals, funded either by manual contributions or automatically from income in a linked category.
- Keep a profile (photo, display name, contact details) and record work/income info for future planning features.
- Generate reports — balance over time, spending by category, month-over-month comparison — and export them as CSV or PDF.
- Use the app in Portuguese or English, in light or dark mode, on desktop or mobile.
- (Admins) Check basic usage stats and recent server errors from an admin panel.

## 🚀 Tech Stack
- **Frontend:** React + TypeScript + Vite, React Router, TanStack Query, Zustand, Tailwind CSS, i18next, Recharts
- **Backend:** NestJS + TypeORM
- **Database:** PostgreSQL
- **Observability:** Prometheus + Grafana
- **Deployment:** Docker Compose, fully self-hosted (see `backend/README.md` for setup)

## 🛠️ Methodology & Planning
- **UI/UX Design:** High-fidelity prototyping in Figma.
- **Project Management:** Agile (Scrum), tracked in Trello.
- **Architecture:** Client-server with a RESTful API.

_Started as an academic project; now actively maintained and self-hosted._
