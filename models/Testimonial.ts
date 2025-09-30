
import { TestimonialDocument } from 'types';
import mongoose, { Schema, model, models } from 'mongoose';

const TestimonialSchema = new Schema<TestimonialDocument>({
  name: { type: String, required: true },
  story: { type: String, required: true },
  image: { type: String, required: true },
  aiHint: { type: String },
  order: { type: Number, default: 0 },
  rating: { type: Number, default: 5, min: 1, max: 5 },
});

// Use mongoose.model to ensure the model is not re-registered.
const TestimonialModel = models.Testimonial || model<TestimonialDocument>('Testimonial', TestimonialSchema);

export default TestimonialModel;
