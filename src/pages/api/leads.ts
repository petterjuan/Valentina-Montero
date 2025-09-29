
import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '@/lib/firebase';
import { type Lead } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const firestore = getFirestore();
    if (!firestore) {
        return res.status(500).json({ message: "La base de datos de Firestore no está disponible." });
    }

    if (req.method === 'GET') {
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
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                } as Lead;
            });

            return res.status(200).json(leads);

        } catch (error) {
            console.error("Error fetching leads from Firestore:", error);
            return res.status(500).json({ message: "No se pudieron cargar los prospectos desde la base de datos." });
        }
    } else if (req.method === 'POST') {
        try {
            const { email, source, fullName } = req.body;

            if (!email || !source) {
                return res.status(400).json({ message: 'Email y source son requeridos.' });
            }

            const leadRef = firestore.collection('leads').doc(email);
            await leadRef.set({
                email,
                source,
                fullName: fullName || '',
                status: 'subscribed',
                createdAt: new Date(),
                updatedAt: new Date(),
            }, { merge: true });

            return res.status(201).json({ success: true, message: 'Lead guardado con éxito.' });

        } catch (error) {
            console.error("Error saving lead to Firestore:", error);
            return res.status(500).json({ message: "No se pudo guardar el prospecto en la base de datos." });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

    