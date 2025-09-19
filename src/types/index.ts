
import { Document } from 'mongoose';

// Represents a blog post, now fetched from Shopify or MongoDB
export interface Post {
    id: string;
    source: 'Shopify' | 'MongoDB';
    title: string;
    slug: string;
    excerpt: string;
    content: string; // This will be HTML from Shopify
    imageUrl?: string;
    aiHint?: string; // Often from image alt text
    createdAt: Date;
}

export interface Testimonial {
    _id: string;
    id: string;
    name: string;
    story: string;
    image: string;
    aiHint?: string;
    order?: number;
    rating?: number;
}

export interface Lead {
    id: string;
    email: string;
    source: string;
    status: string;
    createdAt: Date;
}

export interface LogEntry {
    id: string;
    message: string;
    level: 'info' | 'warn' | 'error';
    timestamp: Date;
    metadata?: Record<string, any>;
}

// Mongoose document interfaces
export interface PostDocument extends Omit<Post, 'id' | 'source'>, Document {}
export interface TestimonialDocument extends Omit<Testimonial, '_id' | 'id'>, Document {}
