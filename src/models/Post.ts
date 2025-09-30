
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  imageUrl?: string;
  aiHint?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    imageUrl: { type: String },
    aiHint: { type: String },
  },
  { timestamps: true }
);

const PostModel = (mongoose.models.Post as Model<IPost>) || mongoose.model<IPost>("Post", PostSchema);

export default PostModel;
