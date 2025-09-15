# Manual de Usuario: VM Fitness Hub

¡Felicitaciones por tu nueva página web de coaching! Este manual está diseñado para ayudarte a entender y gestionar todas las funcionalidades clave de tu sitio.

## 1. Gestión de Clientas en Firestore

Tu base de datos en tiempo real para gestionar nuevas clientas y compras.

### ¿Qué es Firestore?
Firestore es la base de datos donde se guarda automáticamente la información cada vez que una clienta se inscribe en un plan o inicia la compra de un producto digital.

### ¿Cómo acceder?
1.  Ve a tu proyecto en la [Consola de Firebase](https://console.firebase.google.com/).
2.  En el menú de la izquierda, haz clic en **Build > Firestore Database**.

### Colecciones Principales

#### a) `signups` (Inscripciones a Planes de Coaching)
Aquí encontrarás la información de cada clienta que se inscribe en tus planes de 6 o 12 semanas.

- **Campos guardados:**
  - `fullName`: Nombre completo de la clienta.
  - `email`: Correo electrónico.
  - `phone`: Teléfono (opcional).
  - `planName`: El plan que eligió (ej. "Plan de Coaching de 12 Semanas").
  - `planPrice`: El precio del plan.
  - `meetLink`: El enlace **simulado** de Google Meet.
  - `registrationDate`: La fecha y hora exactas de la inscripción.

#### b) `leads` (Interesadas en Productos Digitales)
Aquí se registran las usuarias que inician el proceso de compra de tu PDF "Muscle Bites".

- **Campos guardados:**
  - `email`: Correo de la interesada.
  - `fullName`: Nombre completo.
  - `productName`: "Muscle Bites".
  - `status`: Por defecto se guarda como `"initiated"`.
  - `createdAt`: La fecha y hora del registro.

---

## 2. Flujo de Coaching (Planes de 6 y 12 semanas)

Este es el flujo que sigue una clienta para inscribirse en un plan de coaching.

1.  **Selección del Plan**: En la sección "Programas", la clienta hace clic en "Elegir Plan". El plan de 12 semanas se muestra destacado como "MÁS POPULAR".
2.  **Formulario de Inscripción**: Se abre una ventana emergente (modal) con un formulario que pide:
    - Nombre Completo (obligatorio).
    - Email (obligatorio).
    - Teléfono (opcional).
    - **Consentimiento**: Una casilla obligatoria para aceptar ser contactada.
3.  **Confirmación y Guardado**: Al enviar el formulario:
    - Los datos se guardan en la colección `signups` de Firestore.
    - Se genera un enlace **simulado** de Google Meet.
    - La clienta ve un mensaje de éxito indicando que revise su correo para los siguientes pasos.

**Acción Requerida de tu parte:**
- **Agendamiento Real**: Revisa la colección `signups` para ver las nuevas inscripciones. Contacta a la clienta por email o teléfono para coordinar la primera reunión y enviarle el enlace real de Google Meet.
- **Proceso de Pago**: Contacta a la clienta para gestionar el pago del plan a través del método que prefieras (transferencia, link de pago manual, etc.).

---

## 3. Flujo de Producto Digital ("Muscle Bites")

Este es el flujo para la venta de tu PDF.

1.  **Selección del Producto**: La clienta hace clic en "Comprar PDF" en la tarjeta del producto "Muscle Bites".
2.  **Formulario de Compra**: Se abre la misma ventana emergente, pero adaptada para el producto digital.
3.  **Inicio del Proceso**: Al enviar el formulario:
    - Los datos se guardan en la colección `leads` de Firestore con el estado `"initiated"`.
    - La clienta ve un mensaje indicando que será redirigida para el pago.

**Acción Requerida de tu parte (Próximos Pasos):**
- **Integrar una Pasarela de Pago (Stripe)**: Para automatizar el cobro, necesitarás conectar Stripe. El flujo está preparado para esto. Un desarrollador puede ayudarte a:
    1.  Crear una sesión de pago de Stripe cuando se envía el formulario.
    2.  Configurar un *webhook* que escuche la confirmación del pago.
    3.  Una vez confirmado el pago, cambiar el estado en Firestore a `"paid"`.
- **Automatizar Envío del PDF**:
    1.  Sube el PDF a **Firebase Storage**.
    2.  Configura una función que, tras el pago confirmado, genere un enlace de descarga seguro y temporal.
    3.  Integra un servicio de envío de correos (como SendGrid o Mailgun) para enviar automáticamente el email con el enlace de descarga.

---

## 4. Generador de Planes de Entrenamiento con IA

Esta herramienta gratuita ofrece valor a tus visitantes y funciona como un imán de prospectos.

- **Cómo funciona**:
    1. La usuaria selecciona sus preferencias (objetivo, nivel, equipo, etc.).
    2. Hace clic en "Generar Mi Plan".
    3. El sistema utiliza IA (Genkit) para crear una rutina de entrenamiento personalizada en texto.
    4. El resultado se muestra directamente en la página.

- **Objetivo Estratégico**: Después de recibir su plan gratuito, se le anima a considerar tus planes de coaching personalizados para un seguimiento más detallado.

---

## 5. Próximos Pasos y Escalabilidad

Tu web está construida con una base sólida y escalable. Aquí tienes una guía para llevarla al siguiente nivel:

1.  **Activa los Pagos Reales con Stripe**:
    - Obtén tus claves de API de Stripe.
    - Implementa la lógica para crear sesiones de `Stripe Checkout` en el flujo `plan-signup-flow.ts`.
    - Crea el *webhook* para recibir y procesar las notificaciones de pago.

2.  **Automatiza el Emailing**:
    - Elige un proveedor (SendGrid, Mailgun, Resend).
    - Configura plantillas de correo para la bienvenida a los planes y la entrega de productos digitales.
    - Intégralo en el flujo para que los correos se envíen automáticamente tras una acción (inscripción, pago).

3.  **Configura un Dominio Personalizado**:
    - En Firebase Hosting, sigue los pasos para conectar tu propio dominio (ej. `www.valentinamontero.com`).

4.  **Monitorea el Rendimiento**:
    - Utiliza Google Analytics para ver qué secciones de tu página son las más visitadas y cómo se comportan las usuarias.

¡Listo! Con este manual, tienes el control total de tu nueva plataforma de coaching. ¡Mucho éxito!

---

## 6. ¿Qué tecnología hay detrás de tu web? (Explicado de forma sencilla)

Tu nueva web es mucho más que una simple página. Es una potente herramienta de negocio construida con la mejor tecnología disponible para que sea rápida, segura y fácil de hacer crecer.

#### **1. Un motor súper rápido (Next.js 14)**
La web está construida con la tecnología más moderna para que cargue al instante. Esto no solo hace felices a tus visitantes, sino también a Google, lo que ayuda a que te encuentren más fácilmente.

#### **2. Un cerebro de Inteligencia Artificial (Google AI)**
El generador de planes de entrenamiento no es un simple formulario. Usa la misma tecnología de inteligencia artificial que Google para crear, en tiempo real, una rutina verdaderamente personalizada para cada visitante. Es como tener una entrenadora asistente trabajando para ti 24/7.

#### **3. Dos sistemas de archivo inteligentes (Bases de Datos)**
- **Para el blog y testimonios (MongoDB):** Usamos una base de datos de alto rendimiento, perfecta para guardar y mostrar los artículos de tu blog y las historias de éxito de tus clientas de forma muy rápida.
- **Para tus nuevos prospectos y clientas (Firestore):** Cuando alguien se inscribe en un plan o descarga tu guía, sus datos se guardan al instante y de forma segura en otro sistema, listo para que lo consultes.

#### **4. Una tienda y caja registradora de primer nivel (Shopify y Stripe)**
- **Catálogo de productos (Shopify):** Tu web se conecta directamente a tu panel de Shopify. Si cambias un precio o un programa allí, se actualiza automáticamente en la web. Tú gestionas todo desde un lugar que ya conoces.
- **Pagos seguros (Stripe):** Para vender tus productos digitales, usamos Stripe, el sistema de pagos más seguro y confiable del mundo. Todo el proceso de pago es manejado por ellos, dándote a ti y a tus clientas total tranquilidad.

#### **5. Formularios blindados y un diseño adaptable**
- **Seguridad en los formularios:** Cada vez que una clienta llena un formulario, la información viaja por un canal seguro y directo al servidor, protegiendo sus datos.
- **Diseño impecable (Tailwind y ShadCN):** El diseño de la web no solo es bonito, sino también inteligente. Se adapta perfectamente a cualquier dispositivo (móvil, tablet, ordenador) para que siempre se vea genial.

En resumen, tienes una plataforma de negocio digital completa, equipada con la misma tecnología que usan las grandes empresas, pero diseñada a la medida de tus necesidades para ayudarte a crecer.
