
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
