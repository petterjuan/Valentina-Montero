
import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '@/lib/firebase';
import { type Lead } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const firestore = getFirestore();
    if (!firestore) {
        return res.status(500).json({ message: "La base de datos de Firestore no está disponible." });
    }

    try {
        const leadsSnapshot = await firestore.collection('leads')
            .orderBy('createdAt', 'desc')
            .get();
            
        if (leadsSnapshot.empty) {
            return res.status(200).json([]);
        }
        
        const leads = leadsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email,
                source: data.source || 'N/A',
                status: data.status || 'N/A',
                // Important: Convert Timestamp to a serializable format (ISO string)
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            } as Lead;
        });

        return res.status(200).json(leads);

    } catch (error) {
        console.error("Error fetching leads from Firestore:", error);
        return res.status(500).json({ message: "No se pudieron cargar los prospectos desde la base de datos." });
    }
}
