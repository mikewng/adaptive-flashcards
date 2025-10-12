# Introduction
Flashcard studying with card scheduling adapted to your progress.

Problem - Regular flashcard applications require users to brute force through a set card schedule, and this does not account for each individual's learning curves.
Adaptive flashcards aims to maximize efficiency in learning by understanding how you are progressing by:
- Laying out users with the very basic Quizlet-like functionalities (e.g. flashcards, writing mode, multiple choice mode)
- Providing context-enriched card scheduling that alters card scheduling depending on how difficult or easy a user finds a card
- Analyzing a user's statistics on card and deck reviews and offering visual dashiboards to track progress

This is a fullstack application that attempts to improve and enrich memorization learning for learners by implementing algorithms that decide what cards to be reviewed beyond a simple SuperMemo2 algorithm (like what Anki uses). Adaptive flashcards will change its method of
retention and reviews based on each user's deck, as it takes in data from the user (e.g. user's correct/incorrect answer, user's answer time, and historical answers with similar cards) instead of brute forcing through a static schedule. Adaptive flashcards can also provide
visual dashboards and statistics of your progress with each deck.

<img width="1537" height="908" alt="image" src="https://github.com/user-attachments/assets/0946c4b9-f74b-4b1a-8c73-ae27bceb8749" />

# App Features
## The Basic Flashcard Features
Basic functionalities such as creating, updating, deleting, and reviewing decks and cards through a clean user interface
- Quizlet-Like Study Modes: Basic non-AI reviewing like Flashcards mode, and AI-enchanced Writing and Multiple Choice modes
- Anki-like Metadata: Cards can have tags, which can also better inform the ML models.
- User Authentication: A JWT-based login and authentication system to give users a secure account
- Deck and Card Management: View, create, update, and delete decks and cards within those decks
- Cloud Storage: All decks and cards are saved onto a cloud SQL database so that the user does not need to worry about saving cards locally
- Import from PDF to Flashcards: Ability for users to convert notes or documents into flashcards

## Core Adaptive Learning Features
- Augmented SM-2 Algorithm: SM-2 Algorithm (used by Anki) that now incorporates user response times and card statistics history to schedule card reviews
- Advanced ML Models:
  - Logistic Regression: Determining a "Likelihood to Remember" Percentage to help better inform card retention
  - Bayesian Knowledge Tracing: Tracking mastery of a certain card
  - Feed Forward Neural Networks: A combination of both concepts merged into one to conduct pattern recognition of a user's behavior on each card.
- Language Model:
  - Assistant that can provide a general summary of trends of mistakes and success of a deck.

## Community Features (Planned)
General ability to search for publicly published decks

# App Structure and Tech Stack
## Frontend (ReactJS, JavaScript)
### The basic user-facing website for the flashcard application.
- **Framework**: Next.js 15.5.4 with React 19.1.0
- **Styling**: SCSS/Sass
- **Routing**: React Router DOM
- **Build Tool**: Turbopack
- **Development Server**: Next.js dev server (port 3000)

## Backend (FastAPI, Python)
### The entrypoint into flashcard CRUD and service logic .
- **Framework**: FastAPI 0.118.0
- **Server**: Uvicorn 0.37.0
- **Language**: Python 3.x
- **API Version**: v1 REST API
- **JWT**: python-jose with cryptography
- **Password Hashing**: passlib with bcrypt
- **CORS**: Configurable origins

## Database (PostgreSQL)
### The storage for all flashcard tables and information, ranging from user data to card review data.
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0.43
- **Migrations**: Alembic 1.16.5
- **Driver**: psycopg 3.2.10

## Docker
### The containerization responsible for providing a consistent development and testing environment
- **Containerization**: Docker & Docker Compose
- **Services**:
  - PostgreSQL container (port 5432)
  - FastAPI backend container (port 8000)
  - Next.js frontend container (port 3000)
- **Networking**: Bridge network for inter-service communication
- **Data Persistence**: Docker volumes for PostgreSQL data

# Getting Started
### Prerequisites
- **Docker & Docker Compose** (recommended for full setup)
- **Node.js 18+** and **npm** (for local frontend development)
- **Python 3.10+** (for local backend development)
- **PostgreSQL 16** (if running locally without Docker)

## Quick Start

### Front End
1. cd frontend -> cd flashcards-fe
2. npm i (first time)
3. npm run dev

### Backend
1. cd backend
2. python -m venv .venv
3. source .venv/Scripts/activate
4. pip install -r requirements.txt
5. python -m app.main

### Database
1. Create database: 'flashcards'
2. Update DATABASE_URL in environment
3. cd backend -> alembic upgrade head

## Acknowledgments

- SuperMemo-2 algorithm by Piotr Woźniak
- Inspired by Anki and other spaced repetition systems
- Inspired by Quizlet for writing and multiple choice study options

---

**Note**: This application is under active development. Features and documentation are subject to change.


