
import mongoose from 'mongoose';
import PostModel from '@/models/Post';
import TestimonialModel from '@/models/Testimonial';

// It's recommended to load environment variables from your execution environment
// For local development, you can use a .env file and a script in package.json
// e.g., "seed": "ts-node -r dotenv/config src/lib/seed.ts"

const fallbackTestimonials = [
  {
    name: "Maria G.",
    story: "¡Valentina cambió mi vida! Perdí 9 kilos y gané muchísima confianza. Su plan de 12 semanas fue duro pero increíblemente gratificante.",
    image: "https://picsum.photos/100/100?random=13",
    aiHint: "happy woman",
    order: 1,
    rating: 5,
  },
  {
    name: "Ana P.",
    story: "La guía de nutrición fue un antes y un después. Finalmente entiendo cómo alimentar mi cuerpo correctamente. Valentina es un gran apoyo y sabe mucho.",
    image: "https://picsum.photos/100/100?random=14",
    aiHint: "woman portrait",
    order: 2,
    rating: 5,
  },
  {
    name: "Laura M.",
    story: "Después de solo 12 semanas, mis niveles de energía están por las nubes y he alcanzado todas mis metas de fuerza iniciales. Fue la mejor inversión en mi salud.",
    image: "https://picsum.photos/100/100?random=15",
    aiHint: "woman hiking",
    order: 3,
    rating: 5,
  },
  {
    name: "Sofia R.",
    story: "Nunca pensé que disfrutaría hacer ejercicio. El plan personalizado me mantuvo enganchada y nunca me he sentido más fuerte. ¡Recomiendo el plan de 6 semanas!",
    image: "https://picsum.photos/100/100?random=16",
    aiHint: "smiling woman",
    order: 4,
    rating: 5,
  },
];

const fallbackPosts = [
    {
        title: "5 Mitos del Fitness que Debes Dejar de Creer Hoy",
        slug: "5-mitos-fitness",
        excerpt: "Desmentimos las creencias más comunes que te impiden alcanzar tus metas. Prepárate para sorprenderte y cambiar tu enfoque.",
        content: "<p>El mundo del fitness está lleno de información, pero no toda es correcta. Aquí desmentimos 5 mitos que probablemente has escuchado y que podrían estar saboteando tu progreso. Desde 'sudar más es quemar más grasa' hasta 'las pesas te harán voluminosa', es hora de separar la realidad de la ficción para que puedas entrenar de manera más inteligente y efectiva.</p>",
        imageUrl: "https://picsum.photos/seed/post1/600/400",
        aiHint: "fitness myth",
        createdAt: new Date("2024-05-10T10:00:00Z"),
    },
    {
        title: "Nutrición 101: Cómo Balancear tus Macronutrientes",
        slug: "nutricion-101-macros",
        excerpt: "Proteínas, carbohidratos y grasas. Te explicamos de forma sencilla qué son, por qué los necesitas y cómo distribuirlos para tus objetivos.",
        content: "<p>Entender los macronutrientes es la base de una nutrición exitosa. En este artículo, te guiaremos a través de los conceptos básicos de las proteínas, los carbohidratos y las grasas. Aprenderás por qué cada uno es vital para tu energía, recuperación y salud general, y te daremos estrategias prácticas para balancearlos según si tu objetivo es perder peso, ganar músculo o simplemente sentirte mejor.</p>",
        imageUrl: "https://picsum.photos/seed/post2/600/400",
        aiHint: "healthy food",
        createdAt: new Date("2024-05-15T11:30:00Z"),
    },
    {
        title: "La Importancia del Descanso: Más Allá del Gimnasio",
        slug: "importancia-del-descanso",
        excerpt: "El entrenamiento es solo una parte de la ecuación. Descubre por qué el sueño y la recuperación activa son cruciales para tu transformación.",
        content: "<p>Puedes entrenar tan duro como quieras, pero si no le das a tu cuerpo el tiempo y las herramientas para recuperarse, no verás los resultados que esperas. Hablamos sobre la ciencia del descanso, la importancia del sueño de calidad y las técnicas de recuperación activa que puedes implementar para reducir el dolor muscular, prevenir lesiones y maximizar tus ganancias. ¡El verdadero crecimiento ocurre cuando descansas!</p>",
        imageUrl: "https://picsum.photos/seed/post3/600/400",
        aiHint: "woman resting",
        createdAt: new Date("2024-05-20T09:00:00Z"),
    },
];

async function seedDatabase() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error("Missing MONGODB_URI in environment variables.");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log("Connected to database via Mongoose.");

        // Seed Testimonials
        await TestimonialModel.deleteMany({});
        console.log("Cleared 'testimonials' collection.");
        await TestimonialModel.insertMany(fallbackTestimonials);
        console.log(`Seeded ${fallbackTestimonials.length} testimonials.`);
        
        // Seed Posts
        await PostModel.deleteMany({});
        console.log("Cleared 'posts' collection.");
        await PostModel.insertMany(fallbackPosts);
        console.log(`Seeded ${fallbackPosts.length} posts.`);

        console.log("\nDatabase seeding completed successfully!");

    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Mongoose connection closed.");
    }
}

seedDatabase();
