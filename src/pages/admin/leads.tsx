// pages/admin/leads.tsx
import React, { useEffect, useState } from 'react';
import { getFirestore } from '../../lib/firebase'; // Assuming getFirestore is correctly set up
import { type Lead } from "@/types";

// This function should now be defined here or imported from a standard lib file (NOT a server action file)
async function getLeadsForAdmin(): Promise<Lead[]> {
  const firestore = getFirestore();
  if (!firestore) {
    console.error("Firestore not configured, cannot fetch leads.");
    return [];
  }
  
  try {
    const leadsSnapshot = await firestore.collection('leads')
        .orderBy('createdAt', 'desc')
        .get();
        
    if (leadsSnapshot.empty) {
      return [];
    }
    
    const leads = leadsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        source: data.source || 'N/A',
        status: data.status || 'N/A',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as Lead;
    });

    return leads;
  } catch (error) {
    console.error("Error fetching leads from Firestore:", error);
    return [];
  }
}


export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const data = await getLeadsForAdmin();
        setLeads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  if (loading) return <p>Cargando leads...</p>;

  return (
    <div>
      <h1>Leads</h1>
      {leads.length > 0 ? (
        <ul>
            {leads.map((lead) => (
            <li key={lead.id}>
                {lead.email} - {lead.source} - {new Date(lead.createdAt).toLocaleDateString()}
            </li>
            ))}
        </ul>
      ) : (
        <p>No hay leads para mostrar.</p>
      )}
    </div>
  );
}