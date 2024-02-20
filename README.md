# LumiJobs Server

This documentation provides an overview of the backend architecture, APIs, and functionality of the LumiJob application.

## Table of Contents
1. [Introduction](#introduction)
2. [Technologies Used](#technologies-used)
3. [Setup](#setup)
4. [API Endpoints](#api-endpoints)
5. [Stripe Integration](#stripe-integration)
6. [DND (Drag and Drop) Feature](#dnd-feature)

## Introduction
The backend of the LumiJob application serves as the server-side infrastructure responsible for handling client requests, managing databases, and integrating third-party services like Stripe for payment processing. It provides various APIs for user authentication, job posting, candidate search, seminar posting, blog posting, and more.

## Technologies Used
- **Node.js**: Backend runtime environment
- **Express.js**: Web application framework for Node.js
- **MongoDB**: NoSQL database for storing application data
- **Stripe API**: Integrated for payment processing
- **Cors**: Middleware for enabling Cross-Origin Resource Sharing
- **Dotenv**: Module for loading environment variables from a .env file
- **MongoDB Node.js Driver**: Official MongoDB driver for Node.js
- **Stripe Node.js Library**: Official Stripe library for Node.js

## Setup
To set up the backend locally, follow these steps:
1. Clone the repository from [GitHub Repository Link](#) to your local machine.
2. Navigate to the backend directory.
3. Run `npm install` to install dependencies.
4. Create a `.env` file in the root directory and add necessary environment variables from MongoDB
  ```env
     DB_USER=xxxxxxxxxxxxxxxxx
     DB_PASS=xxxxxxxxxxxxxxxxx
     STRIPE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxx
```
     
5. Run `nodemon index.js` to start the server.

## API Endpoints
The backend provides various API endpoints for different functionalities:
- **User Management**:
  - `/users`: POST request to create a new user.
  - `/check-role/:email`: GET request to check user role.
  - `/check-which-role/:email`: GET request to check user role.
- **Job Management**:
  - `/postJob`: POST request to post a new job.
  - `/post-jobs`: POST request to post a new job.
  - `/delete-job/:id`: DELETE request to delete a job.
- **Seminar Management**:
  - `/post-the-seminar`: POST request to post a new seminar.
  - `/delete-seminar/:id`: DELETE request to delete a seminar.
- **Blog Management**:
  - `/post-the-blog`: POST request to post a new blog.
  - `/update-blog/:id`: PATCH request to update a blog.
  - `/delete-blog/:id`: DELETE request to delete a blog.
- **Subscription Management**:
  - `/create-payment-intent`: POST request to create a payment intent for subscription.
  - `/payments`: POST request to handle subscription payments.
  - `/subscription`: POST request to store subscription data temporarily.
- **Drag and Drop Feature**:
  - `/dnd-applicants/:id`: GET request to fetch applicants for a job.
  - `/dnd-pre-select/:id`: GET request to fetch pre-selected applicants for a job.
  - `/dnd-interview/:id`: GET request to fetch applicants selected for interview.
  - `/dnd-selected/:id`: GET request to fetch finally selected applicants for a job.
  - `/updateApplicantsStatus/:id`: PUT request to update applicants' status for a job.

## Stripe Integration
The backend integrates with the Stripe API to handle subscription payments. It provides endpoints for creating payment intents and processing subscription payments securely.

## DND (Drag and Drop) Feature
The backend supports a Drag and Drop feature for managing job applicants. It provides APIs to fetch applicants, pre-selected candidates, candidates selected for an interview, and finally selected candidates for a job. These APIs facilitate efficient candidate management and selection processes.

For detailed information on each endpoint and its usage, refer to the inline comments and documentation provided within the backend codebase.

---
- Front-end: https://github.com/msasif2000/LumiJob-Client
---
- PS: This project is in development. More information about this project and technologies used will be updated.
---