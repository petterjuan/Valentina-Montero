
import { TestimonialDocument } from '@/types';
import mongoose, { Schema, models } from 'mongoose';

const TestimonialSchema = new Schema<TestimonialDocument>({
  name: { type: String, required: true },
  story: { type: String, required: true },
  image: { type: String, required: true },
  aiHint: { type: String },
  order: { type: Number, default: 0 },
});

const TestimonialModel = models.Testimonial || mongoose.model<TestimonialDocument>('Testimonial', TestimonialSchema);

export default TestimonialModel;
