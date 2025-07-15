# Invoicing Application - Full-Stack Test Assignment
This is a comprehensive full-stack invoicing application built to fulfill a 12-hour test assignment. The application provides core invoicing functionalities, client management, and a suite of advanced features including a metrics dashboard, PDF generation, mock user authentication, partial payment tracking, and an AI-powered business analyst.

## 🚀 Features Implemented
The project successfully implements all core objectives and a wide range of advanced features.
### Core Objectives
- **Client Management:** Full CRUD (Create, Read, Update, Delete) functionality for clients.
- **Invoice Creation:** Dynamic form with line items and automatic total calculation.
- **Invoice List View:** A comprehensive, sortable, and filterable view of all invoices.
- **Payment Status:** Invoices can be marked as paid, which updates their status across the application.

### High-Impact Bonus
- **AI-Powered Query:** Integrated with the OpenAI API, allowing users to ask complex business questions in natural language (e.g., "Which clients are at risk of churn?") and receive data-driven insights.

### Advanced Objectives
- **Dashboard with Metrics:** A central dashboard displaying key business KPIs and charts.
- **Overdue Handling:** Automatic detection and visual highlighting of overdue invoices.
- **Payment Tracking (Partial Payments):** Ability to record multiple partial payments against a single invoice and track the remaining balance.
- **Invoice PDF Export:** Generation and download of a professional PDF for any invoice.
- **Mock Authentication:** A complete, simulated user flow for Sign Up, Login, and Logout.
- **Responsive UI:** The application is designed to be fully functional on both desktop and mobile devices.
- **Audit Log (Activity Tracker):** A dedicated page to view a log of all major actions taken within the application.
- **Email Invoice Reminders:** The UI and mock backend endpoint are built, but are currently non-functional due to a bug.
- **Import Clients from CSV:** The UI and backend endpoint are built, but are currently non-functional due to a bug.

## ⏱️ Time Spent
The project was completed over an approximate 10 hour period.
- **Backend Setup & Core API (Python/FastAPI):** 2.5 hours
- **Frontend Setup & Core UI (React/MUI):** 2 hours
- **Advanced Features (Dashboard, PDF, Payments, Audit Log):** 3.5 hours
- **AI Integration (Backend & Frontend):** 0.5 hours
- **Authentication, Final Polish & Debugging:** 1.5 hours

## 🛠️ Tech Stack
- **Backend:** Python 3, FastAPI, Uvicorn
- **Database:** SQLAlchemy (ORM), SQLite
- **Frontend:** React (with Vite), MUI (Material-UI)
- **API & State Management:** Axios, React Context API
- **File Handling:** ReportLab (for PDFs), Python csv module
- **AI Integration:** OpenAI API (gpt-3.5-turbo)

## ⚙️ Project Setup & How to Run
Follow these instructions to get the application running locally.
### Prerequisites
- Node.js (v18 or later)
- Python (v3.9 or later)
- An OpenAI API Key
### Backend Setup
1. Navigate to the `server` directory:
```bash
cd server
```
2. Create and activate a Python virtual environment:
```bash
# Create the environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```
3. Install all required dependencies:
```bash
pip install -r requirements.txt
```
4. Set up environment variables:
- In the /server directory, create a new file named .env.
- Add your OpenAI API key to this file. It must be named exactly as follows:
  ```bash
  OPENAI_API_KEY="sk-YourSecretKeyGoesHere"
  ```
5. Initialize the database schema:
- This command will create and update your database.db file with all the necessary tables.
  ```bash
  alembic upgrade head
  ```
6. Run the backend server:
   ```bash
    uvicorn app.main:app --reload
    ```
The backend will now be running on http://localhost:8000.
## Frontend Setup
1. Open a new, separate terminal window.
2. Navigate to the client directory:
   ```bash
    cd client
    ```
3. Install all required dependencies:
    ```bash
    npm install
    ```
4. Run the frontend development server:
    ```bash
    npm run dev
    ```
The frontend will be running on http://localhost:5173 (or the next available port).

# 🤔 Thought Process & Prioritization
My strategy was to build a solid, functional foundation first, then layer on the high-value features as requested by the assignment.

1. **Foundation First:** I established the backend API with FastAPI and the database models with SQLAlchemy. Building and testing all core CRUD endpoints before touching the UI ensured the application's logic was sound from the start.
2. **Core UI:** I then built the corresponding React frontend pages using MUI to achieve a professional and responsive layout quickly.
3. **High-Impact Features:** With the core application working, I prioritized the AI-Powered Query as it was highlighted as a major advantage. Following that, I implemented other advanced features that demonstrate a breadth of skills: Dashboard (data visualization), PDF Export (file generation), Payment Tracking (complex business logic), and Audit Logging (architectural patterns).
4. **User Experience Polish:** Finally, I added the Mock Authentication flow and refined the overall UI to create a complete and polished user experience from sign-up to logout.

# 🐛 Known Limitations & Bugs

- **BUG: Client CSV Import Fails:** The UI for uploading a CSV file and the backend endpoint (/api/import/clients/csv) are both implemented. However, when a file is uploaded, the backend is not processing it correctly, leading to a server-side error. My initial debugging suggests the issue may be in how the file stream is being read or parsed by the csv module.
- **BUG: Email Reminder Not Functional:** Similar to the import feature, the frontend modal to preview and send an email reminder is complete, and the mock backend endpoint (/api/mock-email/send) exists. However, there is a communication or data-formatting error preventing the frontend from successfully triggering the endpoint.
- **Limitation: Invoice Number Generation:** The current system for generating invoice numbers (e.g., INV-1001) is based on a simple count of existing database rows. This is not safe for a multi-user environment where two users could create an invoice simultaneously, potentially leading to a race condition and duplicate numbers. A production-ready solution would use a dedicated database sequence.

# 🔮 What I'd Do Next
If given more time, my roadmap would be:

- **Fix Bugs:** My absolute first priority would be to resolve the CSV Import and Email Reminder bugs to complete the intended feature set.
- **Implement Real Authentication:** I would replace the mock authentication with a secure, JWT (JSON Web Token) based system, including password hashing and user roles (Admin vs. User) to control access to different features.
- **Add End-to-End Testing:** I would use a framework like Cypress or Playwright to write automated tests for critical user flows like creating an invoice, recording a partial payment, and using the AI query tool.
- **Containerize the Application:** I would create Dockerfiles for the frontend and backend and a docker-compose.yml file to allow the entire application to be started with a single docker-compose up command, ensuring a consistent development and deployment environment.
