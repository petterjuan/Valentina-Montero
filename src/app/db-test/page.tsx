
import { MongoClient } from "mongodb";

async function TestDBConnection() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;

    if (!uri || !dbName) {
        return {
            status: "error",
            message: "MONGODB_URI or MONGODB_DB_NAME environment variable is not set.",
            data: null
        };
    }

    let client: MongoClient | undefined;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);

        const collection = db.collection("testimonials");
        const data = await collection.findOne({});

        return {
            status: "success",
            message: "Successfully connected to MongoDB and fetched data.",
            data: data ? JSON.stringify(data, null, 2) : "No documents found in 'testimonials' collection."
        };
    } catch (e: any) {
        return {
            status: "error",
            message: `Failed to connect or fetch data: ${e.message}`,
            data: null
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

export default async function DbTestPage() {
    const result = await TestDBConnection();

    return (
        <div className="container mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-4 font-headline">Database Connection Test</h1>
            <div className={`p-4 rounded-lg border ${result.status === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
                <h2 className="text-xl font-semibold">Status: <span className="capitalize">{result.status}</span></h2>
                <p className="mt-2 font-medium">Message: {result.message}</p>
            </div>
            {result.data && (
                <div className="mt-6">
                    <h3 className="text-2xl font-bold mb-2 font-headline">Data Fetched:</h3>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md text-sm overflow-x-auto">
                        <code>{result.data}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}

export const dynamic = 'force-dynamic';
