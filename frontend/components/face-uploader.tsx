"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaceUploaderProps {
  onSelect: (file: File) => void;
  isScanning: boolean;
  disabled?: boolean;
}

export function FaceUploader({ onSelect, isScanning, disabled }: FaceUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      onSelect(file);
    },
    [onSelect, disabled]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "relative flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
        isDragging ? "border-scan bg-scan/5" : "border-border",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-scan/60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <img
          src={preview}
          alt="Uploaded face scan preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <ScanFace size={32} className="text-text-muted" />
          <p className="text-sm text-text-muted">
            Drop a face photo here, or click to upload
          </p>
        </div>
      )}

      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/20"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="h-1/3 w-full animate-scanline bg-gradient-to-b from-transparent via-scan/70 to-transparent" />
            </div>
            <div className="absolute inset-0 border-2 border-scan/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {!preview && !isScanning && (
        <div className="absolute bottom-3 right-3 text-text-muted">
          <UploadCloud size={16} />
        </div>
      )}
    </div>
  );
}
