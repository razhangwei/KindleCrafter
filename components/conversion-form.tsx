"use client";

import { useState, useCallback } from "react";
import { FileUpload } from "./file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { convertToEpub, convertAndSend } from "@/app/actions/convert";
import { toast } from "sonner";
import { extractTitleFromMarkdown } from "@/lib/markdown";

interface ConversionFormProps {
  kindleEmailConfigured: boolean;
  emailServiceConfigured: boolean;
}

export function ConversionForm({
  kindleEmailConfigured,
  emailServiceConfigured,
}: ConversionFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");

  const extractTitleFromFilename = (filename: string): string => {
    return filename
      .replace(/\.md$/i, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile.size > 4 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 4MB.");
      return;
    }

    const text = await selectedFile.text();
    setFile(selectedFile);
    setMarkdown(text);
    setTitle(extractTitleFromFilename(selectedFile.name));
  }, []);

  const handlePasteChange = useCallback((text: string) => {
    // Size validation (4MB limit)
    const sizeInBytes = new Blob([text]).size;
    if (sizeInBytes > 4 * 1024 * 1024) {
      toast.error("Text too large. Maximum size is 4MB.");
      return;
    }

    setMarkdown(text);

    // Try to extract title from first H1
    const extractedTitle = extractTitleFromMarkdown(text);
    if (extractedTitle) {
      setTitle(extractedTitle);
    } else {
      setTitle(""); // Clear title, user must provide
    }
  }, []);

  const handleDownload = async () => {
    if (!markdown.trim()) {
      toast.error(
        inputMode === "file"
          ? "Please select a file first"
          : "Please paste markdown content"
      );
      return;
    }

    if (!title.trim()) {
      toast.error("Please provide a title for your document");
      return;
    }

    setIsLoading(true);
    try {
      const result = await convertToEpub({
        markdown,
        filename: file?.name || `${title.replace(/\s+/g, "-").toLowerCase()}.md`,
        title: title || undefined,
        author: author || undefined,
      });

      if (result.success && result.epubBase64 && result.filename) {
        const blob = new Blob(
          [Uint8Array.from(atob(result.epubBase64), (c) => c.charCodeAt(0))],
          { type: "application/epub+zip" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("EPUB downloaded!");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to generate EPUB");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToKindle = async () => {
    if (!markdown.trim()) {
      toast.error(
        inputMode === "file"
          ? "Please select a file first"
          : "Please paste markdown content"
      );
      return;
    }

    if (!title.trim()) {
      toast.error("Please provide a title for your document");
      return;
    }

    setIsLoading(true);
    try {
      const result = await convertAndSend({
        markdown,
        filename: file?.name || `${title.replace(/\s+/g, "-").toLowerCase()}.md`,
        title: title || undefined,
        author: author || undefined,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to send to Kindle");
    } finally {
      setIsLoading(false);
    }
  };

  const canSendToKindle = kindleEmailConfigured && emailServiceConfigured;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convert Markdown to EPUB</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs
          defaultValue="file"
          onValueChange={(v) => setInputMode(v as "file" | "paste")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-6">
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={file}
              disabled={isLoading}
            />
          </TabsContent>

          <TabsContent value="paste" className="mt-6">
            <Textarea
              placeholder="Paste your markdown here..."
              value={inputMode === "paste" ? markdown : ""}
              onChange={(e) => handlePasteChange(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              disabled={isLoading}
            />
          </TabsContent>
        </Tabs>

        {markdown && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title {inputMode === "paste" && "*"}
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Book title"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author (optional)</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? "Processing..." : "Download EPUB"}
              </Button>
              <Button
                onClick={handleSendToKindle}
                disabled={isLoading || !canSendToKindle}
                className="flex-1"
                title={
                  !canSendToKindle
                    ? "Configure Kindle email and email service first"
                    : undefined
                }
              >
                {isLoading ? "Sending..." : "Send to Kindle"}
              </Button>
            </div>

            {!canSendToKindle && (
              <p className="text-sm text-muted-foreground text-center">
                {!kindleEmailConfigured
                  ? "Configure your Kindle email in Settings to enable sending."
                  : "Email service not configured (RESEND_API_KEY, SENDER_EMAIL)."}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
