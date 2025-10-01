
import { type Document, type Types } from 'mongoose';

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

// Interface for raw data from DB, before mapping to Post
export interface IPost {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  imageUrl?: string;
  aiHint?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for lean post objects from Mongoose
export interface IPostLean extends Omit<IPost, '_id'> {
  _id: Types.ObjectId;
}

export interface ITestimonial {
  name: string;
  story: string;
  image: string;
  aiHint?: string;
  order?: number;
  rating?: number;
  createdAt: Date;
}

export interface ITestimonialLean extends Omit<ITestimonial, '_id'> {
    _id: Types.ObjectId;
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

export interface Program {
  title: string;
  price: number;
  features: string[];
  image?: {
    src: string;
    alt: string;
  };
  isPopular?: boolean;
  isDigital?: boolean;
  handle?: string;
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

export interface SystemStatus {
  firebase?: { status: 'success' | 'error'; message: string };
  mongo?: { status: 'success' | 'error'; message: string };
  mongoData?: { status: 'success' | 'error'; message: string };
  shopify?: { status: 'success' | 'error'; message: string };
}

    
