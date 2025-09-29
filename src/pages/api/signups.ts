
import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '@/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const firestore = getFirestore();
    if (!firestore) {
        return res.status(500).json({ message: "La base de datos de Firestore no está disponible." });
    }

    try {
        const { fullName, email, phone, planName, planPrice } = req.body;

        if (!fullName || !email || !planName || planPrice === undefined) {
            return res.status(400).json({ message: 'Faltan campos requeridos para la inscripción.' });
        }
        
        // Simulate meet link generation
        const meetLink = "https://meet.google.com/placeholder-for-" + email.split('@')[0];

        const signupData = {
            fullName,
            email,
            phone: phone || '',
            planName,
            planPrice,
            meetLink,
            registrationDate: new Date(),
        };

        await firestore.collection('signups').add(signupData);

        return res.status(201).json({ success: true, message: 'Inscripción procesada con éxito.', meetLink });

    } catch (error) {
        console.error("Error saving signup to Firestore:", error);
        return res.status(500).json({ message: "No se pudo procesar la inscripción en la base de datos." });
    }
}

    