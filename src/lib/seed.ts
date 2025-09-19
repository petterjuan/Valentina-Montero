import mongoose from 'mongoose';
import TestimonialModel from '@/models/Testimonial';
import placeholderImages from './placeholder-images.json';

// It's recommended to load environment variables from your execution environment
// For local development, you can use a .env file and a script in package.json
// e.g., "seed": "ts-node -r dotenv/config src/lib/seed.ts"

const fallbackTestimonials = [
  {
    name: "Maria G.",
    story: "¡Valentina cambió mi vida! Perdí 9 kilos y gané muchísima confianza. Su plan de 12 semanas fue duro pero increíblemente gratificante.",
    image: placeholderImages.seed.testimonial1.src,
    aiHint: placeholderImages.seed.testimonial1.aiHint,
    order: 1,
    rating: 5,
  },
  {
    name: "Ana P.",
    story: "La guía de nutrición fue un antes y un después. Finalmente entiendo cómo alimentar mi cuerpo correctamente. Valentina es un gran apoyo y sabe mucho.",
    image: placeholderImages.seed.testimonial2.src,
    aiHint: placeholderImages.seed.testimonial2.aiHint,
    order: 2,
    rating: 5,
  },
  {
    name: "Laura M.",
    story: "Después de solo 12 semanas, mis niveles de energía están por las nubes y he alcanzado todas mis metas de fuerza iniciales. Fue la mejor inversión en mi salud.",
    image: placeholderImages.seed.testimonial3.src,
    aiHint: placeholderImages.seed.testimonial3.aiHint,
    order: 3,
    rating: 5,
  },
  {
    name: "Sofia R.",
    story: "Nunca pensé que disfrutaría hacer ejercicio. El plan personalizado me mantuvo enganchada y nunca me he sentido más fuerte. ¡Recomiendo el plan de 6 semanas!",
    image: placeholderImages.seed.testimonial4.src,
    aiHint: placeholderImages.seed.testimonial4.aiHint,
    order: 4,
    rating: 5,
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

        console.log("\nDatabase seeding for testimonials completed successfully!");
        console.log("Blog posts are now managed directly in Shopify and are not seeded.");

    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Mongoose connection closed.");
    }
}

seedDatabase();
