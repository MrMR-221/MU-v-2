"use client";

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function IngestPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus("idle");
            setMessage("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus("uploading");
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/ingest', {
                method: 'POST',
                body: formData,
            });

            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 200)}...`);
            }

            if (res.ok) {
                setStatus("success");
                setMessage(`Successfully uploaded! Processed ${data.chunks} chunks.`);
            } else {
                setStatus("error");
                setMessage(data.error || "Upload failed.");
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            setStatus("error");
            setMessage("An error occurred during upload. Check console for details. " + error.message);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 p-8">
            <div className="max-w-xl w-full mx-auto bg-white rounded-xl shadow-lg p-8">
                <div className="mb-8 text-center">
                    <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Knowledge Base Ingestion</h1>
                    <p className="text-gray-500 mt-2">Upload PDFs to train the ChatBot's memory.</p>
                </div>

                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {file ? (
                            <div className="flex flex-col items-center">
                                <FileText className="w-10 h-10 text-blue-500 mb-2" />
                                <span className="font-medium text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-gray-600 font-medium">Click to select a PDF</span>
                                <span className="text-sm text-gray-400 mt-1">or drag and drop here</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || status === "uploading"}
                        className={`w-full py-3 rounded-md font-medium text-white transition-all ${status === "uploading" ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {status === "uploading" ? "Processing Document..." : "Start Ingestion"}
                    </button>

                    {/* Status Feedback */}
                    {status === "success" && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-800">Success</h4>
                                <p className="text-sm text-green-600">{message}</p>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-red-800">Error</h4>
                                <p className="text-sm text-red-600">{message}</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 text-xs text-gray-400 text-center">
                        Note: Processing may take a few seconds per page due to rate limits.
                    </div>
                </div>
            </div>
        </div>
    );
}
