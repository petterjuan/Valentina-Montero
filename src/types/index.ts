
import { Document } from 'mongoose';

export interface Post {
    _id: string;
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    imageUrl?: string;
    aiHint?: string;
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

// Mongoose document interfaces
export interface PostDocument extends Omit<Post, '_id' | 'id'>, Document {}
export interface TestimonialDocument extends Omit<Testimonial, '_id' | 'id'>, Document {}
