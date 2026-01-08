# Price Comparison Backend

This is a Firebase Cloud Functions backend for a price comparison app using Gemini AI.

## Setup

1.  **Install Dependencies**
    ```bash
    cd functions
    npm install
    ```

2.  **Environment Variables**
    Set the following environment variables in your Firebase project or `.env` file (for local dev):
    - `GEMINI_API_KEY`: Your Google Gemini API Key.
    - `FIREBASE_API_KEY`: Your Firebase Web API Key (for login endpoint).

    To set in Firebase:
    ```bash
    firebase functions:config:set gemini.key="YOUR_KEY" app.apikey="YOUR_FIREBASE_API_KEY"
    ```
    *(Note: The code uses `process.env`. If using `functions:config`, update `config/gemini.ts` to use `functions.config().gemini.key`)*.
    
    For this hackathon setup, we used `dotenv`. Create `functions/.env`:
    ```
    GEMINI_API_KEY=your_gemini_key
    FIREBASE_API_KEY=your_firebase_api_key
    ```

3.  **Deploy**
    ```bash
    firebase deploy --only functions
    ```

## API Endpoints

- **Auth**
  - `POST /api/auth/signup`: Create account.
  - `POST /api/auth/login`: Login (returns token).
  
- **Products**
  - `GET /api/products/compare?q=iphone`: Compare prices.
  
- **AI Chat**
  - `POST /api/chat`: Chat with PriceBot. Body: `{ "userId": "...", "message": "..." }`
  
- **Tracking**
  - `POST /api/alerts/track`: Track a product.
  - `GET /api/user/searches`: Get history.

## Scheduled Tasks
- `scheduledPriceCheck`: Runs every 24h to check for price drops on tracked items.
