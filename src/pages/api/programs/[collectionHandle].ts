
import { NextApiRequest, NextApiResponse } from 'next';
import { shopifyStorefront } from "@/lib/shopify";
import { Program } from "@/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { collectionHandle, maxProducts = '10' } = req.query;

    if (req.method !== 'GET' || !collectionHandle || typeof collectionHandle !== 'string') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method Not Allowed or Invalid Handle`);
    }

    try {
        const { collection } = await shopifyStorefront.request(
            `query getCollectionByHandle($handle: String!, $first: Int!) {
                collection(handle: $handle) {
                    products(first: $first) {
                        edges {
                            node {
                                title
                                handle
                                priceRange {
                                    minVariantPrice {
                                        amount
                                    }
                                }
                                features: metafield(namespace: "custom", key: "features") {
                                    value
                                }
                                is_popular: metafield(namespace: "custom", key: "is_popular") {
                                    value
                                }
                                is_digital: metafield(namespace: "custom", key: "is_digital") {
                                    value
                                }
                                images(first: 1) {
                                    edges {
                                        node {
                                            url
                                            altText
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`,
            {
                variables: {
                    handle: collectionHandle,
                    first: parseInt(maxProducts as string, 10),
                },
            }
        );

        if (!collection) {
            console.warn(`Shopify collection with handle "${collectionHandle}" not found.`);
            return res.status(404).json({ message: 'Collection not found' });
        }

        const programs: Program[] = collection.products.edges.map(({ node }: any) => ({
            title: node.title,
            handle: node.handle,
            price: parseFloat(node.priceRange.minVariantPrice.amount),
            features: node.features ? JSON.parse(node.features.value) : [],
            isPopular: node.is_popular ? JSON.parse(node.is_popular.value) : false,
            isDigital: node.is_digital ? JSON.parse(node.is_digital.value) : false,
            image: node.images.edges[0] ? {
                src: node.images.edges[0].node.url,
                alt: node.images.edges[0].node.altText || node.title,
            } : undefined,
        }));

        res.status(200).json(programs);
    } catch (error) {
        console.error(`Error fetching Shopify programs for collection "${collectionHandle}":`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
