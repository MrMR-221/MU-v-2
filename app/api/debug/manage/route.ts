import { NextResponse } from 'next/server';
import * as lancedb from '@lancedb/lancedb';
import path from 'path';
import { generateEmbedding } from '@/lib/local-rag';

const DB_PATH = path.join(process.cwd(), '.lancedb');
const TABLE_NAME = 'university_docs_gemini_embed_001';

export async function DELETE(req: Request) {
    try {
        const { type, value } = await req.json(); // type: 'file' | 'chunk', value: filename | id

        const db = await lancedb.connect(DB_PATH);
        const table = await db.openTable(TABLE_NAME);

        if (type === 'file') {
            console.log(`Deleting file: ${value}`);
            await table.delete(`filename = '${value}'`);
        } else if (type === 'chunk') {
            console.log(`Deleting chunk: ${value}`);
            await table.delete(`id = '${value}'`);
        } else {
            return NextResponse.json({ error: "Invalid delete type" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, text, filename } = await req.json();

        if (!id || !text) {
            return NextResponse.json({ error: "Missing id or text" }, { status: 400 });
        }

        const db = await lancedb.connect(DB_PATH);
        const table = await db.openTable(TABLE_NAME);

        // 1. Generate new embedding
        console.log(`Updating chunk ${id}... Re-embedding...`);
        const newVector = await generateEmbedding(text);

        // 2. Delete old row
        await table.delete(`id = '${id}'`);

        // 3. Insert new row
        // We preserve the original ID to keep it stable, or we could generate a new one. 
        // Keeping it stable is better for UI.
        await table.add([{
            id: id,
            vector: newVector,
            text: text,
            filename: filename || 'unknown_edit',
            created_at: Date.now()
        }]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
