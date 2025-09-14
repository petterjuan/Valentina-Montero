
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!key) {
      return res.status(400).json({ ok: false, error: "FIREBASE_SERVICE_ACCOUNT_KEY is not set." });
    }

    let decoded;
    try {
        decoded = Buffer.from(key, "base64").toString("utf-8");
    } catch (e) {
        return res.status(400).json({ ok: false, error: "FIREBASE_SERVICE_ACCOUNT_KEY is not a valid Base64 string." });
    }

    let parsed;
    try {
        parsed = JSON.parse(decoded);
    } catch (e) {
        // If Base64 decoding worked but JSON parsing failed, let's try parsing the original key as plain JSON
        try {
            parsed = JSON.parse(key);
        } catch (jsonErr) {
            return res.status(400).json({ ok: false, error: "Key is not valid JSON, nor is it a Base64-encoded JSON string." });
        }
    }

    const requiredFields = ["type", "project_id", "private_key_id", "private_key", "client_email"];
    const missing = requiredFields.filter(field => !(field in parsed));

    if (missing.length > 0) {
      return res.status(400).json({ ok: false, error: "Key is missing required fields.", missing });
    }

    res.status(200).json({ ok: true, project_id: parsed.project_id });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: "An unexpected error occurred.", details: err.message });
  }
}
