# Introduction
Flashcard studying with card scheduling adapted to your progress.

Problem - Regular flashcard applications require brute forcing a set card schedule. Adaptive flashcards aims to maximize efficiency in learning by understanding how you are progressing.

This is a fullstack application that attempts to improve and enrich memorization learning for learners by implementing algorithms that decide what cards to be reviewed beyond a simple SuperMemo2 algorithm (like what Anki uses). Adaptive flashcards will change its method of
retention and reviews based on each user's deck, as it takes in data from the user (e.g. user's correct/incorrect answer, user's answer time, and historical answers with similar cards) instead of brute forcing through a static schedule. Adaptive flashcards can also provide
visual dashboards and statistics of your progress with each deck.

# App Features
## The Basic Flashcard Features
Basic functionalities such as creating, updating, deleting, and reviewing decks and cards through a clean user interface.
- Saved flashcard and decks to each user on a cloud database
- Studying flashcards with a basic SM2 retention algorithm
- Text-input option for studying
- Ability to import notes to be converted into flashcards for a deck

## Core Adaptive Learning Features
AI and Probability Algorithms, such as Logistic Regressions and Gradients, Bayesian Knowledge Tracing, and Feed-Foward Neural Networks work together to provide better card-scheduling for each deck
- Context-enriched card-scheduling to drill in more difficult cards while sprinkling in easier ones
- A general summary of trends of mistakes and successes of a deck
- Dashboard of statistics for each deck

## Community Features
General ability to search for publicly published decks

# App Structure
## Frontend (ReactJS, JavaScript)
- Web Page User Interface
## Backend (FastAPI, Python)
- API Endpoint Definitions
- Database Connection and Migrations Functionality
- App Service Logic and Functionality
## Engine
- Machine Learning Algorithms
- Probability Algorithms
## Docker
- Deployments
