# Amplify Backend

## AWS Services Used

### 1. Amazon S3 (Simple Storage Service)

- **Purpose:** Storing files such as user document scans, images, GIFs, videos, and profile images.

### 2. Amazon SNS (Simple Notification Service)

- **Purpose:** Sending notifications via email, SMS, WhatsApp, and Firebase Cloud Messaging (FCM) for browser push notifications.

### 3. Amazon SQS (Simple Queue Service)

- **Purpose:** Facilitating communication between Lambda functions, particularly for Lambda-to-Lambda communication.

### 4. AWS Lambda

- **Purpose:** Running serverless functions to handle various tasks within the backend system.
- **Types of Lambdas:**
  - _API Logic Lambdas:_ Connected to API Gateway endpoints to handle API logic.
  - _Lambda Layers:_ Provide common modules to other Lambdas for reusability.
  - _Utility Lambdas:_ Provide additional helper functions to process data, hidden away from API exposure.
- **Communication:** SQS allows communication between API Lambdas and Utility Lambdas.

### 5. Amazon API Gateway

- **Purpose:** Providing various API endpoints for communication with the backend system.

## Technology Stack

### 1. Lambda and Lambda Layers

- **Language:** Utility Lambdas may be written in various languages depending on performance concerns.
- **Supported Languages for API Lambdas and Layers:** JavaScript (JS) or TypeScript (TS).

### 2. MongoDB (Atlas Cloud) with Mongoose

- **Purpose:** Storing data in a NoSQL database.
- **Note:** MongoDB Atlas Cloud is used for database management, and Mongoose is utilized for interacting with MongoDB.

### 3. Authentication

- **Custom Authentication Architecture:** Cognito is not used due to issues faced during development, likely due to skill limitations.
