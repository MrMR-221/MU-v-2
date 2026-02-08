import { NextResponse } from 'next/server';
import * as lancedb from '@lancedb/lancedb';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '.lancedb');
const TABLE_NAME = 'university_docs_gemini_embed_001';

export async function GET() {
    try {
        const db = await lancedb.connect(DB_PATH);
        const tableNames = await db.tableNames();

        if (!tableNames.includes(TABLE_NAME)) {
            return NextResponse.json({ documents: [] });
        }

        const table = await db.openTable(TABLE_NAME);
        // Fetch all rows (metadata only would be better, but LanceDB needs projection support)
        // For now, assume < 10k rows is fine to aggregate in memory. 
        // We limit to 5000 to prevent crashing on large datasets.
        const rows = await table.query()
            .limit(5000)
            .toArray();

        // Aggregate by filename
        const docMap = new Map();

        rows.forEach((row: any) => {
            if (!docMap.has(row.filename)) {
                docMap.set(row.filename, {
                    filename: row.filename,
                    chunks: 0,
                    first_indexed: row.created_at || Date.now(),
                    type: row.filename.endsWith('.pdf') ? 'PDF' : 'TEXT'
                });
            }
            const doc = docMap.get(row.filename);
            doc.chunks++;
        });

        const documents = Array.from(docMap.values());

        return NextResponse.json({ documents });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
