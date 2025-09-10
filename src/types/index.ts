
import { ObjectId } from "mongodb";

export interface Post {
    _id: ObjectId;
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
    _id: ObjectId;
    id: string;
    name: string;
    story: string;
    image: string;
    aiHint?: string;
}
