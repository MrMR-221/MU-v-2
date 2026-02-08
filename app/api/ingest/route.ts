import { NextRequest, NextResponse } from 'next/server';
import { parsePDF, parseText, storeDocument } from '@/lib/local-rag';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;

        console.log(`Processing file: ${fileName}`);

        // -- Optional: Save Physical File --
        // User requested to "store the file". 
        // We will save it to 'public/uploads' for reference.
        try {
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, buffer);
            console.log(`Saved physical file to: ${filePath}`);
        } catch (saveError) {
            console.warn("Failed to save physical file (continuing with RAG memory processing):", saveError);
        }

        // 1. Extract Text
        let text = "";
        if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
            text = await parsePDF(buffer);
        } else {
            text = parseText(buffer);
        }

        console.log(`Extracted ${text.length} characters.`);

        // 2. Store & Embed
        const result = await storeDocument(file.name, text);

        if (!result.success) {
            return NextResponse.json({ error: result.error || "Failed to process document (0 chunks created)" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Ingestion complete",
            success: true,
            message: "Ingestion complete",
            chunks: result.chunks,
            previews: result.previews
        });

    } catch (error: any) {
        console.error("Ingestion API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "This is a POST endpoint for file ingestion. Please use a tool like Postman or the Admin UI." });
}
