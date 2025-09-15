
import { PostDocument } from '@/types';
import mongoose, { Schema, model } from 'mongoose';

const PostSchema = new Schema<PostDocument>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  aiHint: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Use mongoose.model to ensure the model is not re-registered.
// Using a lowercase name is a robust practice.
const PostModel = mongoose.models.post || model<PostDocument>('post', PostSchema);

export default PostModel;
