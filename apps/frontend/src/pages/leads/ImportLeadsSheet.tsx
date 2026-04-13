import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, X, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  errorDetails: { row: number; reason: string }[];
}

interface ImportLeadsSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function generateTemplate() {
  const headers = [
    'Nombre', 'Apellido', 'Teléfono', 'Email',
    'Presupuesto', 'Interés en propiedad', 'Notas', 'Origen',
  ];
  const example1 = [
    'Juan', 'Pérez', '0991234567', 'juan@email.com',
    '85000', 'Casa 3 dormitorios norte Quito', 'Cliente referido por amigo', 'REFERRAL',
  ];
  const example2 = [
    'María', 'García', '0987654321', '',
    '120000', 'Apartamento La Carolina', '', 'WEBSITE',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, 'plantilla-leads-homematch.xlsx');
}

export function ImportLeadsSheet({ open, onOpenChange }: ImportLeadsSheetProps) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Solo se permiten archivos .xlsx o .xls');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<ImportResult>('/leads/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      if (res.data.created > 0) {
        void qc.invalidateQueries({ queryKey: ['leads'] });
        void qc.invalidateQueries({ queryKey: ['pipeline'] });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al importar. Verifica el archivo.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#006031]" />
            Importar leads desde Excel
          </SheetTitle>
          <SheetDescription>
            Sube un archivo .xlsx con los datos de tus leads.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">

          {/* Step 1 — Download template */}
          <div className="rounded-xl border bg-gradient-to-br from-[#006031]/5 to-[#23103B]/5 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">Paso 1 — Descarga la plantilla</p>
            <p className="text-xs text-muted-foreground mb-3">
              Usa nuestra plantilla con el formato correcto para evitar errores.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-[#006031] text-[#006031] hover:bg-[#006031]/5"
              onClick={generateTemplate}
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Descargar plantilla Excel
            </Button>
          </div>

          {/* Step 2 — Upload */}
          {!result && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Paso 2 — Sube tu archivo</p>

              {/* Dropzone */}
              <div
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer
                  ${dragging ? 'border-[#006031] bg-[#006031]/5' : 'border-gray-200 hover:border-[#006031]/50 hover:bg-gray-50'}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {file ? (
                  <>
                    <FileSpreadsheet className="h-10 w-10 text-[#006031]" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      className="absolute top-2 right-2 rounded-full p-1 hover:bg-gray-100"
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                    >
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-300" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">
                        Arrastra el archivo aquí o haz clic
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Soporta .xlsx y .xls · Máximo 500 filas
                      </p>
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full bg-[#006031] hover:bg-[#004d26] text-white"
                disabled={!file || loading}
                onClick={() => void handleImport()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Importando…
                  </span>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar leads
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 3 — Result */}
          {result && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-800">Resultado de la importación</p>

              <div className="space-y-2">
                {result.created > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-800 font-medium">
                      {result.created} {result.created === 1 ? 'lead importado' : 'leads importados'} exitosamente
                    </span>
                  </div>
                )}
                {result.skipped > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm text-amber-800 font-medium">
                      {result.skipped} {result.skipped === 1 ? 'lead omitido' : 'leads omitidos'} (duplicados)
                    </span>
                  </div>
                )}
                {result.errors > 0 && (
                  <div className="rounded-lg bg-red-50 px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-sm text-red-800 font-medium">
                        {result.errors} {result.errors === 1 ? 'fila con error' : 'filas con errores'}
                      </span>
                    </div>
                    <ul className="pl-6 space-y-0.5">
                      {result.errorDetails.map((e, i) => (
                        <li key={i} className="text-xs text-red-700">
                          Fila {e.row}: {e.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={reset}
                >
                  Importar otro archivo
                </Button>
                <Button
                  className="flex-1 bg-[#006031] hover:bg-[#004d26] text-white"
                  onClick={() => onOpenChange(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {/* Format guide */}
          {!result && (
            <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-gray-700">Columnas reconocidas:</p>
              <p>Nombre · Apellido · Teléfono · Email</p>
              <p>Presupuesto · Interés en propiedad · Notas</p>
              <p>Origen: MANUAL / WEBSITE / REFERRAL / FACEBOOK / WHATSAPP / GOOGLE</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
