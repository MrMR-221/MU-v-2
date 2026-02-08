"use client";

import { useState } from 'react';
import { Upload, Database, Eye, Terminal, Trash2, Edit2, RefreshCw, Save, X } from 'lucide-react';

export default function PipelineDebugPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState("idle");
    const [logs, setLogs] = useState<string[]>([]);
    const [debugData, setDebugData] = useState<any>(null);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleUpload = async () => {
        if (!file) return;
        setStatus("uploading");
        setLogs([]);
        addLog("Starting upload pipeline...");

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/ingest', { method: 'POST', body: formData });

            // Try to parse JSON, fallback to text if 500
            let data;
            try {
                data = await res.json();
            } catch (e) {
                const text = await res.text();
                throw new Error("Server Error: " + text.substring(0, 100));
            }

            if (res.ok) {
                setStatus("success");
                addLog("Upload complete!");
                addLog(`Processed ${data.chunks} chunks.`);
                setDebugData(data);
            } else {
                setStatus("error");
                addLog("Error: " + data.error);
            }
        } catch (error: any) {
            setStatus("error");
            addLog("Critical pipeline failure: " + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-mono">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Terminal className="w-8 h-8 text-purple-600" />
                        RAG Pipeline Debugger
                    </h1>
                    <p className="text-gray-500 mt-2">Hybrid Architecture: Local LanceDB + Google Embeddings</p>
                </div>

                {/* Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5" /> Ingest PDF
                        </h2>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={!file || status === 'uploading'}
                            className="mt-4 w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {status === 'uploading' ? 'Processing...' : 'Run Pipeline'}
                        </button>
                    </div>

                    {/* Live Logs */}
                    <div className="bg-gray-900 text-green-400 p-6 rounded-lg shadow-sm overflow-y-auto h-64 text-sm">
                        <h2 className="text-gray-400 font-semibold mb-2 uppercase text-xs tracking-wider">Pipeline Logs</h2>
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                        {logs.length === 0 && <span className="text-gray-600">Waiting for jobs...</span>}
                    </div>
                </div>

                {/* Results Visualization */}
                {debugData && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-600" /> Pipeline Inspection
                        </h2>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-green-50 rounded border border-green-100">
                                <span className="block text-2xl font-bold text-green-700">{debugData.chunks}</span>
                                <span className="text-xs text-green-600 uppercase">Chunks Created</span>
                            </div>
                            <div className="p-4 bg-blue-50 rounded border border-blue-100">
                                <span className="block text-2xl font-bold text-blue-700">Xenova Local</span>
                                <span className="text-xs text-blue-600 uppercase">Vector Model</span>
                            </div>
                            <div className="p-4 bg-amber-50 rounded border border-amber-100">
                                <span className="block text-2xl font-bold text-amber-700">LanceDB</span>
                                <span className="text-xs text-amber-600 uppercase">Storage</span>
                            </div>
                        </div>

                        {/* Chunk Previews */}
                        {debugData.previews && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Chunk Analysis (First 5)</h3>
                                <div className="space-y-3">
                                    {debugData.previews.map((chunk: string, i: number) => (
                                        <div key={i} className="bg-gray-50 p-3 rounded border border-gray-100 text-sm text-gray-700">
                                            <span className="font-mono text-xs text-purple-600 font-bold block mb-1">Chunk {i}</span>
                                            {chunk}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Database Inspector */}
                <DbInspector />

                {/* Document Library (New) */}
                <DocumentLibrary />
            </div>
        </div>
    );
}

function DocumentLibrary() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/debug/documents');
            const data = await res.json();
            if (res.ok) {
                setDocs(data.documents);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const deleteFile = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ALL chunks for "${filename}"?`)) return;
        try {
            await fetch('/api/debug/manage', {
                method: 'DELETE',
                body: JSON.stringify({ type: 'file', value: filename })
            });
            fetchDocs();
        } catch (e) {
            alert("Failed to delete file");
        }
    };

    // Auto-load on mount
    useState(() => { fetchDocs(); });

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" /> Ingested Documents
                </h2>
                <button onClick={fetchDocs} className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.length === 0 ? (
                    <div className="col-span-full text-center text-gray-400 py-8 border-2 border-dashed rounded">
                        No documents found in knowledge base.
                    </div>
                ) : (
                    docs.map((doc, i) => (
                        <div key={i} className="p-4 rounded border border-gray-100 bg-gray-50 flex flex-col relative group">
                            <button
                                onClick={() => deleteFile(doc.filename)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete File"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${doc.type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {doc.type}
                                </span>
                                <span className="text-xs text-gray-400">{doc.chunks} Chunks</span>
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm truncate mb-1" title={doc.filename}>{doc.filename}</h3>
                            <span className="text-xs text-gray-500">
                                {new Date(doc.first_indexed).toLocaleDateString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function DbInspector() {
    const [rows, setRows] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [editingRow, setEditingRow] = useState<any>(null); // Track row being edited

    const fetchDb = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/debug/db-view');
            const data = await res.json();
            if (res.ok) {
                setRows(data.rows);
                setCount(data.count);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const deleteChunk = async (id: string) => {
        if (!confirm("Delete this specific chunk?")) return;
        await fetch('/api/debug/manage', {
            method: 'DELETE',
            body: JSON.stringify({ type: 'chunk', value: id })
        });
        fetchDb();
    };

    const saveEdit = async () => {
        if (!editingRow) return;
        try {
            const res = await fetch('/api/debug/manage', {
                method: 'PUT',
                body: JSON.stringify({
                    id: editingRow.id,
                    text: editingRow.text_preview,
                    filename: editingRow.filename
                })
            });

            if (!res.ok) throw new Error("Update failed");
            setEditingRow(null);
            fetchDb();
        } catch (e) {
            alert("Error updating chunk");
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {/* Edit Modal */}
            {editingRow && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="font-bold mb-4">Edit Chunk Content</h3>
                        <p className="text-xs text-gray-500 mb-2">Editing this will re-generate the embedding vector.</p>
                        <textarea
                            className="w-full h-40 p-2 border rounded font-mono text-sm"
                            value={editingRow.text_preview} // Using text_preview for now
                            onChange={(e) => setEditingRow({ ...editingRow, text_preview: e.target.value })}
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setEditingRow(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button onClick={saveEdit} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save & Re-Embed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5 text-gray-700" /> Database Inspector
                </h2>
                <div className="flex items-center gap-4">
                    {count > 0 && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Total Vectors: {count}</span>}
                    <button
                        onClick={fetchDb}
                        className="text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {loading ? 'Refreshing...' : 'Load Records'}
                    </button>
                    <button
                        onClick={async () => {
                            if (!confirm("Are you sure you want to DELETE ALL records? This cannot be undone.")) return;
                            setLoading(true);
                            await fetch('/api/debug/db-view', { method: 'DELETE' });
                            await fetchDb(); // Refresh
                        }}
                        className="text-sm border border-red-200 bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100"
                    >
                        Clear Database
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Filename</th>
                            <th className="p-3">Text Content</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    No records loaded (or database empty)
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 group">
                                    <td className="p-3 font-mono text-xs text-gray-500 align-top" title={row.id}>
                                        {row.id.substring(0, 8)}...
                                    </td>
                                    <td className="p-3 text-blue-600 align-top">{row.filename}</td>
                                    <td className="p-3 text-gray-700 align-top max-w-md truncate">
                                        {row.text_preview}
                                    </td>
                                    <td className="p-3 text-right align-top">
                                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingRow(row)}
                                                className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                                title="Edit Chunk"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteChunk(row.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Delete Chunk"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
