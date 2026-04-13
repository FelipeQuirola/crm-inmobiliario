import { useRef, useState } from 'react';
import { Upload, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { buildImageUrl } from '@/lib/utils';
import { useUploadImages, useDeleteImage } from '@/hooks/useProperties';

interface ImageUploaderProps {
  propertyId: string;
  images: string[];
}

const MAX = 10;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({ propertyId, images }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const upload = useUploadImages(propertyId);
  const deleteImg = useDeleteImage(propertyId);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid = Array.from(files).filter((f) => {
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name}: solo JPG, PNG o WebP`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: máximo 5 MB por imagen`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    const slots = MAX - images.length;
    if (slots <= 0) {
      toast.error(`Máximo ${MAX} imágenes por propiedad`);
      return;
    }
    const toUpload = valid.slice(0, slots);
    if (toUpload.length < valid.length) {
      toast.warning(`Solo se subirán ${toUpload.length} imágenes (límite ${MAX})`);
    }

    setProgress(0);
    upload.mutate(
      { files: toUpload, onProgress: setProgress },
      {
        onSuccess: () => { setProgress(null); toast.success('Imágenes subidas'); },
        onError: () => { setProgress(null); toast.error('Error al subir imágenes'); },
      },
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (url: string) => {
    deleteImg.mutate(url, {
      onSuccess: () => { setConfirmDelete(null); toast.success('Imagen eliminada'); },
      onError: () => toast.error('Error al eliminar imagen'),
    });
  };

  return (
    <div className="space-y-3">
      {/* Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url) => (
            <div key={url} className="group relative aspect-video overflow-hidden rounded-lg border bg-gray-50">
              <img
                src={buildImageUrl(url)}
                alt=""
                className="h-full w-full object-cover"
              />
              {confirmDelete === url ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 p-2">
                  <p className="text-center text-[10px] font-medium text-white">¿Eliminar?</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(url)}
                      disabled={deleteImg.isPending}
                      className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-white/30"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(url)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {images.length < MAX && (
        <div
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer
            ${dragging ? 'border-[#006031] bg-[#006031]/5' : 'border-gray-200 hover:border-[#006031]/50 hover:bg-gray-50'}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Upload className="h-7 w-7 text-gray-300" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Arrastra fotos aquí o haz clic
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG, WebP · Máx. 5 MB · {images.length}/{MAX} fotos
            </p>
          </div>

          {/* Progress bar */}
          {progress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden bg-gray-100">
              <div
                className="h-full bg-[#006031] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {images.length >= MAX && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span>Límite de {MAX} fotos alcanzado.</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-auto px-1 py-0 text-xs text-amber-700"
            onClick={() => setConfirmDelete(images[0])}
          >
            <X className="mr-1 h-3 w-3" /> Eliminar una para agregar más
          </Button>
        </div>
      )}
    </div>
  );
}
