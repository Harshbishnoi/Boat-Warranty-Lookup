# Boat Warranty Lookup System

A MERN stack web application for checking boat warranty information and repair history using a serial number.

## Run the frontend

From the repository root, install the frontend dependencies and start the development server:

```sh
npm --prefix client ci
npm run dev
```

Open `http://localhost:3000` to view the app. For a production build, run `npm run build` and then `npm start`.

## Configure Google sign-in

1. In Google Cloud Console, configure the OAuth consent screen for **External** users and create an OAuth client ID for a **Web application**. To allow any Google account, publish the consent screen to **In production**; in Testing mode, only listed test users can sign in.
2. Add `http://localhost:3000` to the OAuth client's **Authorized JavaScript origins**. For deployment, add your site's HTTPS origin too, set `CLIENT_URL` in `server/.env` to that frontend origin, and set `NEXT_PUBLIC_API_BASE_URL` in the frontend hosting environment to the public API URL.
3. Put the same client ID in `client/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and in `server/.env` as `GOOGLE_CLIENT_ID`. Do not put a client secret in the frontend or commit credentials.
4. Set `DATABASE_URL` and `JWT_SECRET` in `server/.env`, then apply the schema migration with `npm --prefix server run db:migrate`.
5. Rebuild/restart the Docker API so it receives the client ID from `server/.env`:

   ```sh
   cd server
   docker compose --env-file .env up -d --build server
   ```

6. Restart the frontend after changing its environment variables, then open `/login` and choose **Sign in with Google**.

Google sign-in verifies the Google ID token in the Express API and uses the application's existing JWT session. Verified Google email addresses matching an existing account are linked to that account.

## Problem Statement

Boat wants a warranty lookup page where users enter a serial number and see warranty expiry and paginated repair history. Admin users can upload warranty PDFs and attach them to product records. The serial number should be validated against a product database.

## Features

- Serial number validation
- Warranty expiry lookup
- Warranty status
- Paginated repair history
- Admin authentication
- Product management
- Warranty PDF upload
- Warranty PDF attachment

## Tech Stack

- React.js
- Node.js
- Express.js
- MongoDB
- Mongoose
- GitHub

## Team

- Piyush Yadav
- Harshit