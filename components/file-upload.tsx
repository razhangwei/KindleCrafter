"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  selectedFile,
  disabled,
}: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".md")) {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <Card
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`border-2 border-dashed p-8 text-center transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-primary hover:bg-muted/50"
      }`}
    >
      <label className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
        <input
          type="file"
          accept=".md"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          {selectedFile ? (
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">
                Drop a Markdown file here or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Supports .md files up to 4MB
              </p>
            </div>
          )}
        </div>
      </label>
    </Card>
  );
}
