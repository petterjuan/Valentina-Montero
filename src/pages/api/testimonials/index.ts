
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDb from "@/lib/mongoose";
import TestimonialModel from "@/models/Testimonial";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        await connectToDb();
        const testimonials = await TestimonialModel.find({}).sort({ order: 1 }).lean();
        const formattedTestimonials = testimonials.map(doc => ({
            ...doc,
            id: doc._id.toString(),
            _id: doc._id.toString(),
        }));
        res.status(200).json(formattedTestimonials);
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
