import { useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAccessToken, getApiBaseUrl } from '@/services/apiClient';
import type { IDocumentAsset } from '@/services/mediaApi';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const absoluteApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl() || window.location.origin;
  return new URL(path, base).toString();
};

type ProtectedPdfViewerProps = {
  asset: IDocumentAsset;
  viewerUrl: string;
  onClose: () => void;
};

export function ProtectedPdfViewer({
  asset,
  viewerUrl,
  onClose,
}: ProtectedPdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const token = getAccessToken();
  const file = useMemo(
    () => ({
      url: absoluteApiUrl(viewerUrl),
      httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: true,
    }),
    [token, viewerUrl],
  );

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-zinc-950 text-white">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-zinc-950/95 px-3">
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{asset.originalFileName || 'Tài liệu bài học'}</p>
          <p className="text-xs text-zinc-400">Secure PDF Viewer</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/10"
          onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-20 text-center text-xs text-zinc-300">
          {pageNumber}/{Math.max(numPages, 1)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/10"
          onClick={() => setPageNumber((page) => Math.min(numPages || page, page + 1))}
          disabled={!numPages || pageNumber >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/10"
          onClick={() => setScale((current) => Math.max(0.7, Number((current - 0.1).toFixed(1))))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs text-zinc-300">{Math.round(scale * 100)}%</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/10"
          onClick={() => setScale((current) => Math.min(1.7, Number((current + 0.1).toFixed(1))))}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative flex-1 overflow-auto bg-zinc-900 px-3 py-6">
        <div className="mx-auto flex min-h-full w-fit items-start justify-center">
          <Document
            file={file}
            loading={<Loader2 className="mt-24 h-7 w-7 animate-spin text-white" />}
            error={<div className="mt-24 text-sm text-zinc-300">Không thể mở tài liệu.</div>}
            onLoadSuccess={({ numPages: loadedPages }) => {
              setNumPages(loadedPages);
              setPageNumber(1);
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="overflow-hidden rounded border border-white/10 shadow-2xl"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
