import * as lancedb from '@lancedb/lancedb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
// -- Configuration --
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// 1. Parsing Model (AI Vision)
const parserModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// 2. Embedding Model (Google)
// Validated Model: models/gemini-embedding-001 (Found via ListModels)
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

// 3. LanceDB Local Path
const DB_PATH = path.join(process.cwd(), '.lancedb');
// Using a specific table for this model to avoid dimension mismatch
const TABLE_NAME = 'university_docs_gemini_embed_001';

// -- Helper: Connect and Get Table --
async function getTable() {
    const db = await lancedb.connect(DB_PATH);
    const tableNames = await db.tableNames();

    if (!tableNames.includes(TABLE_NAME)) {
        return null;
    }

    return await db.openTable(TABLE_NAME);
}

// -- 1. PDF Parsing (AI Powered) --
export async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        console.log("Parsing PDF using Gemini Flash Latest...");
        const base64Data = buffer.toString('base64');
        const result = await parserModel.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf",
                },
            },
            "You are a PDF transcription engine. EXTRACT THE TEXT EXACTLY AS IT APPEARS. Do not summarize. Do not skip content. Do not rewrite. Return the raw text content only."
        ]);

        const text = result.response.text();
        if (!text) throw new Error("Gemini extraction returned empty text");

        console.log(`Extracted ~${text.length} characters using AI.`);
        return text;

    } catch (error: any) {
        console.error("Error parsing PDF via Gemini:", error);
        throw new Error(`Failed to parse PDF file (AI): ${error.message}`);
    }
}

// -- 1.b Text Parsing (Direct) --
export function parseText(buffer: Buffer): string {
    console.log("Processing text file (Direct Read)...");
    return buffer.toString('utf-8');
}

// -- 2. Cleaning --
export function cleanText(text: string): string {
    return text
        .replace(/\n+/g, ' ')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// -- 3. Embedding (Google gemini-embedding-001) --
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        console.log("Generating embedding with models/gemini-embedding-001...");
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error: any) {
        console.error("Google Embedding Error:", error);
        throw error;
    }
}

// -- 4. Store Pipeline --
export async function storeDocument(fileName: string, text: string) {
    try {
        // 1. Clean
        const cleanedText = cleanText(text);
        if (!cleanedText) return { success: false, chunks: 0 };

        // 2. Chunk
        const chunkSize = 1000; // Larger chunks for Google models
        const overlap = 200;
        const chunks: string[] = [];
        for (let i = 0; i < cleanedText.length; i += (chunkSize - overlap)) {
            chunks.push(cleanedText.slice(i, i + chunkSize));
        }

        console.log(`Processing ${chunks.length} chunks for ${fileName}`);

        const db = await lancedb.connect(DB_PATH);
        const records = [];
        const errors: string[] = [];

        // 3. Embed & Prepare
        for (let index = 0; index < chunks.length; index++) {
            const chunk = chunks[index];
            let vector;
            try {
                vector = await generateEmbedding(chunk);
            } catch (e: any) {
                console.warn(`Failed to embed chunk ${index}`, e);
                errors.push(`Chunk ${index}: ${e.message}`);
                continue;
            }

            records.push({
                id: `${fileName}_${index}_${Date.now()}`,
                vector: vector,
                text: chunk,
                filename: fileName,
                created_at: Date.now()
            });
        }

        if (records.length === 0) {
            console.error("No records created. Errors:", errors);
            return { success: false, chunks: 0, error: `Embedding failed. Sample: ${errors[0]}` };
        }

        // 4. Save to LanceDB
        // Ensure table exists
        try {
            const tableNames = await db.tableNames();
            if (tableNames.includes(TABLE_NAME)) {
                const table = await db.openTable(TABLE_NAME);
                await table.add(records);
            } else {
                await db.createTable(TABLE_NAME, records);
            }
        } catch (e: any) {
            console.error("DB Save Error:", e);
            throw new Error("Failed to save to LanceDB: " + e.message);
        }

        return {
            success: true,
            chunks: chunks.length,
            previews: chunks.slice(0, 5) // Return first 5 chunks for debugging
        };

    } catch (error) {
        console.error("Pipeline Error:", error);
        throw error;
    }
}

// -- 5. Search --
export async function vectorSearch(query: string) {
    const table = await getTable();
    if (!table) return [];

    const queryVector = await generateEmbedding(query);

    const results = await table.search(queryVector)
        .limit(3)
        .toArray();

    return results.map((r: any) => ({
        text: r.text as string,
        score: 1
    }));
}
