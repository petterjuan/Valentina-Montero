# VM Fitness Hub - Coaching & E-commerce Website

Welcome to the GitHub repository for the VM Fitness Hub, a modern, feature-rich website for a fitness coach. This application is built with a powerful stack including Next.js, Firebase, MongoDB, and Stripe, and features an advanced AI content generation engine using Google's Genkit.

![VM Fitness Hub Screenshot](https://picsum.photos/seed/readme/1200/630)

## ✨ Features

- **Coaching Programs & Digital Products**: Displays and manages coaching plans and digital goods (like PDFs) pulled directly from a **Shopify** store.
- **Advanced Sales Funnel**:
    - **Lead Magnet**: Captures leads by offering a free guide.
    - **Tripwire Offer**: Presents a low-cost, high-value offer immediately after a lead subscribes, converting free leads into paying customers instantly.
- **Stripe Integration**: Secure payment processing for digital products and tripwire offers via Stripe Checkout.
- **AI-Powered Content Engine (Google Genkit & Gemini)**:
    - **Personalized Workout Generator**: Creates custom workout plans based on user input and optionally captures their email.
    - **Automatic Blog Post Generation**: A fully autonomous system that uses a **Vercel Cron Job** to trigger an AI agent once a week. The agent writes a new, full-length, SEO-friendly blog post and **publishes it directly to the Shopify blog** via the Shopify Admin API.
- **Dual Database Strategy**:
    - **Shopify**: Manages all products and blog posts. It is the single source of truth for all public content.
    - **Firebase Firestore**: Acts as a real-time CRM to capture leads, coaching plan signups, and application logs for diagnostics.
    - **MongoDB**: Manages internal content like testimonials.
- **Modern UX**:
    - Fully responsive design built with Tailwind CSS and ShadCN UI.
    - Smooth scrolling, a "back-to-top" button, and instant visual feedback on forms.
- **Admin Tools**:
    - **/troubleshoot**: A system status page to quickly diagnose connection issues with external services.
    - **/admin/leads**: An admin-only page to view captured leads directly from the website.

---

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **AI Engine**: [Google Genkit](https://firebase.google.com/docs/genkit) (with Gemini)
- **Databases & Content**: 
    - [Shopify Admin & Storefront APIs](https://shopify.dev/docs/api) (for blog posts, products)
    - [Firebase Firestore](https://firebase.google.com/docs/firestore) (for leads/signups/logs)
    - [MongoDB](https://www.mongodb.com/) (for testimonials)
- **Payments**: [Stripe](https://stripe.com/)
- **Deployment & Automation**: [Vercel](https://vercel.com/) (including Vercel Cron Jobs)

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

Create a file named `.env` in the root of your project and add the following variables. These should also be configured in your hosting provider (e.g., Vercel).

```env
# MongoDB Connection (for testimonials)
# Example: mongodb+srv://<user>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority
MONGODB_URI=
MONGODB_DB_NAME=

# Firebase (for Firestore leads & logs)
# A base64-encoded JSON string of your Firebase service account key
FIREBASE_SERVICE_ACCOUNT_KEY=

# Stripe (for payments)
STRIPE_SECRET_KEY=

# Shopify Storefront API (for reading products & blog posts)
# Your Shopify store domain (e.g., your-store.myshopify.com)
SHOPIFY_STORE_DOMAIN=
# Your public Storefront API access token
SHOPIFY_STOREFRONT_ACCESS_TOKEN=

# Shopify Admin API (for creating AI blog posts)
# Your private Admin API access token (requires `write_content`, `read_content` scopes)
SHOPIFY_ADMIN_ACCESS_TOKEN=
# The handle of the blog you want to post to (e.g., 'news' or 'fitness-tips')
SHOPIFY_BLOG_HANDLE=

# Cron Job Security
# A long, random, secure string to protect your cron job endpoint
CRON_SECRET=

# Application URL (for Stripe Checkout redirects)
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### 4. Seed the Database

To populate your MongoDB database with initial sample data for testimonials, run the seed script.

```bash
npm run seed
```
This will connect to your database, clear the `testimonials` collection, and insert the sample data from `seed.js`. Blog posts are now managed in Shopify.

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
- `npm run seed`: Populates the database with initial testimonial data.

---

## ☁️ Deployment

This application is optimized for deployment on **Vercel**. 

1.  Connect your GitHub repository to a Vercel project.
2.  Configure the environment variables as listed in the `.env` section in the Vercel project settings.
3.  Vercel will automatically build and deploy the application on every push to the `main` branch.

### **Important: Enabling Automatic Blog Posts**
To enable the weekly automatic blog post generation, you must create a file named `vercel.json` in the root of your project with the following content:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-post?secret=YOUR_CRON_SECRET_HERE",
      "schedule": "0 10 * * 1"
    }
  ]
}
```
**Remember to replace `YOUR_CRON_SECRET_HERE` with the same value you used in your environment variables.**
