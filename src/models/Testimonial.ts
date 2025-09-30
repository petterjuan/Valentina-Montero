
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestimonial extends Document {
  name: string;
  story: string;
  image: string;
  aiHint?: string;
  order?: number;
  rating?: number;
  createdAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true },
    story: { type: String, required: true },
    image: { type: String, required: true },
    aiHint: { type: String },
    order: { type: Number, default: 0 },
    rating: { type: Number, default: 5, min: 1, max: 5 },
  },
  { timestamps: true }
);

const TestimonialModel = (mongoose.models.Testimonial as Model<ITestimonial>) || mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);

export default TestimonialModel;

