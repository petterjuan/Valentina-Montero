# VM Fitness Hub - Coaching & E-commerce Website

Welcome to the GitHub repository for the VM Fitness Hub, a modern, feature-rich website for a fitness coach. This application is built with a powerful stack including Next.js, Firebase, MongoDB, and Stripe, and features an AI-powered workout generator using Google's Genkit.

![VM Fitness Hub Screenshot](https://picsum.photos/seed/readme/1200/630)

## ✨ Features

- **Coaching Programs**: Display and manage multi-week coaching plans.
- **Digital Product Sales**: Sell digital goods like PDF guides with a streamlined checkout process.
- **Shopify Integration**: Pulls product information directly from a Shopify collection to display programs and products.
- **Stripe Integration**: Secure payment processing for digital products via Stripe Checkout.
- **AI Workout Generator**: A custom tool built with Google's Genkit (and Gemini) that creates personalized workout plans based on user input (goals, experience, equipment).
- **Blog Platform**: A fully functional blog with posts managed in a MongoDB database.
- **Lead Generation**: Forms for capturing user interest and signing up for free guides.
- **Firestore Integration**: Captures signups for coaching plans in a Firebase Firestore database for manual follow-up.
- **Responsive Design**: Modern and mobile-first interface built with Tailwind CSS and ShadCN UI.

---

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **AI**: [Google Genkit](https://firebase.google.com/docs/genkit) (with Gemini)
- **Database**: [MongoDB](https://www.mongodb.com/) (for blog posts and testimonials) & [Firebase Firestore](https://firebase.google.com/docs/firestore) (for signups/leads)
- **Payments**: [Stripe](https://stripe.com/)
- **E-commerce Source**: [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- **Deployment**: [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

---

## 🛠️ Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v20.x or later)
- `npm` or `yarn`

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/vm-fitness-hub.git
cd vm-fitness-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a file named `.env` in the root of your project and add the following variables.

```env
# MongoDB Connection
# Example: mongodb+srv://<user>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority
MONGODB_URI=
MONGODB_DB_NAME=

# Firebase (for Firestore)
# A base64-encoded JSON string of your Firebase service account key
FIREBASE_SERVICE_ACCOUNT_KEY=

# Stripe (for payments)
STRIPE_SECRET_KEY=

# Shopify Storefront API
# Your Shopify store domain (e.g., your-store.myshopify.com)
SHOPIFY_STORE_DOMAIN=
# Your public Storefront API access token
SHOPIFY_STOREFRONT_ACCESS_TOKEN=

# Application URL (for Stripe Checkout redirects)
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### 4. Seed the Database

To populate your MongoDB database with initial sample data for blog posts and testimonials, run the seed script.

```bash
npm run seed
```
This will connect to your database, clear the `posts` and `testimonials` collections, and insert the sample data from `seed.js`.

### 5. Run the Development Server

```bash
npm run dev
```

The application should now be running on [http://localhost:9002](http://localhost:9002).

---

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Creates a production-ready build of the application.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the codebase for potential errors.
- `npm run seed`: Populates the database with initial data.

---

## ☁️ Deployment

This application is configured for easy deployment with **Firebase App Hosting**. The `apphosting.yaml` file is included. To deploy, connect your GitHub repository to a Firebase project with App Hosting enabled.
