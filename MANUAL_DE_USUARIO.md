# Manual de Usuario: VM Fitness Hub

¡Felicitaciones por tu nueva página web de coaching! Este manual está diseñado para ayudarte a entender y gestionar todas las funcionalidades clave de tu sitio.

**English version follows below.**

---

## 1. Gestión de Prospectos y Clientas (Firestore)

Tu base de datos en tiempo real para gestionar todos los contactos generados por la web.

### ¿Cómo acceder?
1.  Ve a tu proyecto en la [Consola de Firebase](https://console.firebase.google.com/).
2.  En el menú de la izquierda, haz clic en **Build > Firestore Database**.

### Colecciones Principales

#### a) `leads` (Prospectos Interesados)
Aquí se registran **todos** los correos electrónicos capturados en el sitio, provenientes de diferentes fuentes.

- **Campos guardados:**
  - `email`: Correo del prospecto.
  - `fullName`: Nombre completo (si se proporciona).
  - `source`: De dónde vino el prospecto (Ej: "Guía Gratuita - 10k Pasos", "Generador IA", "Muscle Bites").
  - `status`: El estado del prospecto (`subscribed` para un suscriptor, `initiated` para alguien que empezó una compra).
  - `createdAt`: La fecha y hora del primer registro.
  - `updatedAt`: La fecha de la última interacción.

#### b) `signups` (Inscripciones a Planes de Coaching)
Aquí encontrarás la información de cada clienta que se inscribe en tus planes de 6 o 12 semanas para un seguimiento manual.

- **Campos guardados:**
  - `fullName`, `email`, `phone` (opcional).
  - `planName`: El plan que eligió (ej. "Plan de Coaching de 12 Semanas").
  - `planPrice`: El precio del plan.
  - `meetLink`: El enlace **simulado** de Google Meet.
  - `registrationDate`: La fecha y hora de la inscripción.

---

## 2. Flujos de Captación de Clientes

Tu web tiene múltiples estrategias para convertir visitantes en clientes.

### a) Flujo de Guía Gratuita + Oferta "Tripwire" (Alto Impacto)
Este es tu embudo de ventas más potente.
1.  **Captación**: Una usuaria introduce su email para descargar la guía "Estrategias para lograr 10k pasos al día".
2.  **Registro en `leads`**: Su correo se guarda en Firestore con la fuente "Guía Gratuita - 10k Pasos".
3.  **Oferta Inmediata (Tripwire)**: Inmediatamente después de suscribirse, la página le muestra una oferta única y por tiempo limitado: la guía "Muscle Bites" a un precio muy reducido (ej. $9 en lugar de $29).
4.  **Compra (Opcional)**: Si acepta la oferta, es dirigida a Stripe para el pago. Esto convierte a un prospecto gratuito en un cliente de pago al instante.

### b) Flujo de Coaching (Planes de 6 y 12 semanas)
1.  **Selección del Plan**: La clienta elige un plan de coaching y llena el formulario.
2.  **Registro en `signups`**: Sus datos se guardan en la colección `signups` de Firestore.
3.  **Confirmación**: Ve un mensaje de éxito y recibe un email (simulado) con los próximos pasos.
4.  **Acción Requerida de tu parte**: Contacta a la clienta para agendar la reunión real y coordinar el pago.

### c) Flujo de Producto Digital ("Muscle Bites" - Compra Directa)
1.  **Selección del Producto**: La clienta hace clic en "Comprar PDF" en la tarjeta del producto.
2.  **Inicio del Proceso**: Llena el formulario. Sus datos se guardan en `leads` con el estado `"initiated"`.
3.  **Redirección al Pago**: Es redirigida automáticamente a la pasarela de pago de Stripe para completar la compra.

---

## 3. Contenido del Blog: Manual y Automático

Tu web combina artículos escritos por ti con contenido generado automáticamente por IA para mantener tu blog siempre fresco.

### a) Posts Manuales (Tus Artículos)
- **Cómo funciona**: Inicia sesión en tu panel de **Shopify**, ve a la sección "Blog Posts" y crea nuevos artículos. Estos aparecerán automáticamente en tu web, priorizados en la parte superior de la lista del blog.
- **Tu Tarea**: Escribir cuando la inspiración llegue. Tienes control total sobre este contenido.

### b) Posts Automáticos con IA
- **Qué hace**: Cada semana, la IA escribe y publica automáticamente un nuevo artículo de blog en tu sitio.
- **Cómo funciona**:
    - Un **Cron Job** (tarea programada) en Vercel se activa una vez por semana (lunes a las 10:00 AM).
    - Esta tarea le pide a la IA que escriba un artículo sobre un tema de fitness o bienestar.
    - El nuevo artículo se guarda en una base de datos (MongoDB) y aparece en tu blog, debajo de tus artículos manuales.
- **Tu Tarea**: ¡Ninguna! El sistema es 100% autónomo y se encarga de mantener el flujo de contenido.

### c) Generador de Planes de Entrenamiento con IA
- **Cómo funciona**: Las usuarias seleccionan sus preferencias y la IA crea una rutina personalizada al instante.
- **Captación de Prospectos**: Si la usuaria introduce su email (opcional), se guarda en la colección `leads` con la fuente "Generador IA".

---

## 4. ¿Qué tecnología hay detrás de tu web? (Explicado de forma sencilla)

Tu web es una plataforma de negocio completa construida con tecnología de vanguardia.

*   **Motor (Next.js 14)**: Para una velocidad de carga instantánea y una experiencia de usuario fluida.
*   **Cerebro de IA (Google AI & Genkit)**: Es el corazón de las funciones inteligentes. No solo crea planes de entrenamiento, sino que también actúa como tu "escritora fantasma", generando artículos de blog completos cada semana.
*   **Bases de Datos y Contenido**:
    *   **Shopify**: Es la fuente principal para tus **productos**, **programas** y los **artículos de blog que escribes manualmente**.
    *   **MongoDB**: Almacena el contenido generado por la IA, como los **artículos de blog automáticos** y los **testimonios de clientes**.
    *   **Firestore**: Funciona como tu CRM en tiempo real, capturando cada prospecto, inscripción y registro de diagnóstico para que puedas actuar sobre ellos.
*   **E-commerce y Pagos**:
    *   **Stripe**: Procesa los pagos de forma segura para tus productos digitales y ofertas "tripwire".
*   **Automatización (Vercel Cron Jobs)**: El programador que le dice a tu IA cuándo escribir un nuevo artículo, asegurando que tu blog siempre tenga contenido fresco para atraer visitantes.
*   **Diseño (Tailwind CSS & ShadCN)**: Un diseño moderno y adaptable que se ve perfecto en cualquier dispositivo.
*   **Herramientas de Administración**:
    *   **Página de Diagnóstico (`/troubleshoot`)**: Una página oculta para verificar el estado de las conexiones a todos los servicios externos (Firebase, MongoDB, Shopify, etc.).
    *   **Panel de Prospectos (`/admin/leads`)**: Una vista simple y segura para consultar la lista de todos los correos electrónicos capturados sin tener que entrar a la consola de Firebase.

---
---

# User Manual: VM Fitness Hub

Congratulations on your new coaching website! This manual is designed to help you understand and manage all the key features of your site.

---

## 1. Lead and Client Management (Firestore)

Your real-time database for managing all contacts generated by the website.

### How to Access?
1.  Go to your project in the [Firebase Console](https://console.firebase.google.com/).
2.  In the left-hand menu, click **Build > Firestore Database**.

### Main Collections

#### a) `leads` (Interested Prospects)
This is where **all** email addresses captured on the site are stored, coming from various sources.

- **Saved fields:**
  - `email`: Prospect's email.
  - `fullName`: Full name (if provided).
  - `source`: Where the lead came from (e.g., "Guía Gratuita - 10k Pasos", "Generador IA", "Muscle Bites").
  - `status`: The lead's status (`subscribed` for a newsletter subscriber, `initiated` for someone who started a purchase).
  - `createdAt`: The date and time of the first registration.
  - `updatedAt`: The date of the last interaction.

#### b) `signups` (Coaching Plan Enrollments)
Here you will find the information for each client who signs up for your 6 or 12-week plans, intended for manual follow-up.

- **Saved fields:**
  - `fullName`, `email`, `phone` (optional).
  - `planName`: The chosen plan (e.g., "Plan de Coaching de 12 Semanas").
  - `planPrice`: The price of the plan.
  - `meetLink`: The **simulated** Google Meet link.
  - `registrationDate`: The exact date and time of the enrollment.

---

## 2. Customer Acquisition Flows

Your website has multiple strategies to convert visitors into customers.

### a) Free Guide + "Tripwire" Offer Flow (High Impact)
This is your most powerful sales funnel.
1.  **Acquisition**: A user enters their email to download the "Estrategias para lograr 10k pasos al día" guide.
2.  **Registration in `leads`**: Their email is saved in Firestore with the source "Guía Gratuita - 10k Pasos".
3.  **Immediate Offer (Tripwire)**: Immediately after subscribing, the page shows them a unique, limited-time offer: the "Muscle Bites" guide at a steep discount (e.g., $9 instead of $29).
4.  **Purchase (Optional)**: If they accept the offer, they are redirected to Stripe for payment. This instantly converts a free lead into a paying customer.

### b) Coaching Flow (6 and 12-week plans)
1.  **Plan Selection**: The client chooses a coaching plan and fills out the form.
2.  **Registration in `signups`**: Their data is saved in the `signups` collection in Firestore.
3.  **Confirmation**: They see a success message and receive a (simulated) email with the next steps.
4.  **Action Required from You**: Contact the client to schedule the actual meeting and coordinate payment.

### c) Digital Product Flow ("Muscle Bites" - Direct Purchase)
1.  **Product Selection**: The client clicks "Comprar PDF" on the product card.
2.  **Process Initiation**: They fill out the form. Their data is saved in `leads` with the status `"initiated"`.
3.  **Redirect to Payment**: They are automatically redirected to the Stripe payment gateway to complete the purchase.

---

## 3. Blog Content: Manual and Automatic

Your website combines articles written by you with content automatically generated by AI to keep your blog fresh.

### a) Manual Posts (Your Articles)
- **How it works**: Log into your **Shopify** dashboard, go to the "Blog Posts" section, and create new articles. They will automatically appear on your website and be prioritized at the top of the blog list.
- **Your Task**: Write whenever inspiration strikes. you have full control over this content.

### b) Automatic AI Posts
- **What it does**: Every week, the AI automatically writes and publishes a new blog post to your site.
- **How it works**:
    - A **Cron Job** (scheduled task) in Vercel runs once a week (Mondays at 10:00 AM).
    - This task asks the AI to write an article on a fitness or wellness topic.
    - The new article is saved to a database (MongoDB) and appears on your blog, right below your manual articles.
- **Your Task**: None! The system is 100% autonomous and handles the content flow for you.

### c) AI Workout Plan Generator
- **How it works**: Users select their preferences, and the AI instantly creates a personalized routine.
- **Lead Capture**: If the user enters their email (optional), it is saved in the `leads` collection with the source "Generador IA".

---

## 4. What technology is behind your website? (Explained Simply)

Your website is a complete business platform built with cutting-edge technology.

*   **Engine (Next.js 14)**: For instant loading speeds and a fluid user experience.
*   **AI Brain (Google AI & Genkit)**: This is the heart of the smart features. It not only creates workout plans but also acts as your "ghostwriter," generating complete, high-quality blog posts every week.
*   **Databases & Content**:
    *   **Shopify**: The primary source for your **products**, **programs**, and the **blog articles you write manually**.
    *   **MongoDB**: Stores content generated by the AI, such as **automatic blog articles** and **client testimonials**.
    *   **Firestore**: Functions as your real-time CRM, instantly capturing every lead, enrollment, and diagnostic log so you can act on them.
*   **E-commerce and Payments**:
    *   **Stripe**: Securely processes payments for your digital products and "tripwire" offers.
*   **Automation (Vercel Cron Jobs)**: The scheduler that tells your AI when to write a new article, ensuring your blog always has fresh content to attract visitors.
*   **Design (Tailwind CSS & ShadCN)**: A modern, adaptive design that looks perfect on any device.
*   **Admin Tools**:
    *   **Diagnostics Page (`/troubleshoot`)**: A hidden page to check the connection status of all external services (Firebase, MongoDB, Shopify, etc.).
    *   **Leads Panel (`/admin/leads`)**: A simple, secure view to check the list of all captured emails without needing to log into the Firebase console.
