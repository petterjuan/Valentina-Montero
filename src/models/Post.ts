
import { PostDocument } from '@/types';
import mongoose, { Schema, models } from 'mongoose';

const PostSchema = new Schema<PostDocument>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  aiHint: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const PostModel = models.Post || mongoose.model<PostDocument>('Post', PostSchema);

export default PostModel;
