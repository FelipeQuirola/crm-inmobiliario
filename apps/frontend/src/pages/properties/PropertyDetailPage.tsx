import { useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Maximize2,
  Bed,
  Bath,
  Car,
  MapPin,
  DollarSign,
  Tag,
  Users,
  Trash2,
  Edit2,
  Link2,
  Unlink,
  Image as ImageIcon,
  FileDown,
  Share2,
  Copy,
  MessageCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store/auth.store';
import { useProperty, useDeleteProperty, useUnlinkLead } from '@/hooks/useProperties';
import { formatUSD, buildImageUrl } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { PropertyFormSheet } from './PropertyFormSheet';
import { PropertyPdfSheet } from './PropertyPdfSheet';

const PropertyMap = lazy(() =>
  import('@/components/ui/PropertyMap').then((m) => ({ default: m.PropertyMap }))
);
import { LinkLeadSheet } from './LinkLeadSheet';
import type { PropertyType, PropertyStatus } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PropertyType, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  TERRENO: 'Terreno',
  OFICINA: 'Oficina',
  LOCAL: 'Local',
  BODEGA: 'Bodega',
};

const STATUS_CONFIG: Record<PropertyStatus, { label: string; cls: string }> = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-green-100 text-green-700' },
  RESERVADA:  { label: 'Reservada',  cls: 'bg-amber-100 text-amber-700' },
  VENDIDA:    { label: 'Vendida',    cls: 'bg-gray-100 text-gray-600' },
  INACTIVA:   { label: 'Inactiva',   cls: 'bg-red-100 text-red-600' },
};

// ─── Cover image / gallery ────────────────────────────────────────────────────

function PropertyCover({ images }: { images: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [errored, setErrored] = useState(false);
  const src = buildImageUrl(images[activeIdx]);

  if (!src || errored) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100">
        <Building2 className="h-20 w-20 text-indigo-200" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <img
        key={src}
        src={src}
        alt=""
        className="h-52 w-full rounded-xl object-cover"
        onError={() => setErrored(true)}
      />
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <ThumbnailButton
              key={i}
              url={buildImageUrl(url)}
              active={i === activeIdx}
              onClick={() => { setActiveIdx(i); setErrored(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThumbnailButton({
  url,
  active,
  onClick,
}: {
  url: string;
  active: boolean;
  onClick: () => void;
}) {
  const [err, setErr] = useState(false);
  return err ? (
    <div
      onClick={onClick}
      className={`flex h-14 w-14 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 bg-gray-100 ${active ? 'border-indigo-500' : 'border-transparent'}`}
    >
      <ImageIcon className="h-4 w-4 text-gray-400" />
    </div>
  ) : (
    <img
      src={url}
      alt=""
      onClick={onClick}
      className={`h-14 w-14 flex-shrink-0 cursor-pointer rounded-lg border-2 object-cover ${active ? 'border-indigo-500' : 'border-transparent'}`}
      onError={() => setErr(true)}
    />
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { data: property, isLoading, isError } = useProperty(id ?? '');
  const deleteProperty = useDeleteProperty();
  const unlinkLead = useUnlinkLead(id ?? '');

  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${import.meta.env.VITE_SITE_URL ?? 'https://homematchinmobiliaria.com'}/propiedades/${id}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Te comparto esta propiedad: ${property?.title ?? ''}\n${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteProperty.mutateAsync(id);
    navigate('/propiedades');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-96 lg:col-span-3" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-gray-700">Propiedad no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/propiedades')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[property.status];
  const linkedLeadIds = property.interestedLeads.map((l) => l.lead.id);
  const canDelete =
    currentUser?.role === 'ADMIN' ||
    currentUser?.id === property.createdBy.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/propiedades')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="bg-[#006031] hover:bg-[#004d26] text-white"
            onClick={() => setPdfOpen(true)}
          >
            <FileDown className="mr-1.5 h-3.5 w-3.5" />
            Ficha PDF
          </Button>

          {/* Share popover */}
          <Popover open={shareOpen} onOpenChange={setShareOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="border-[#006031] text-[#006031] hover:bg-[#006031]/5"
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Compartir
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-xl border border-gray-200 bg-white shadow-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">Compartir propiedad</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={publicUrl}
                  className="text-xs h-8 flex-1 select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button size="sm" variant="outline" className="h-8 px-3 flex-shrink-0" onClick={() => void handleCopyLink()}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 text-xs"
                  onClick={() => void handleCopyLink()}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copiar link
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-xs"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit2 className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => void handleDelete()}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left — Info ──────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-3">
          {/* Cover image / gallery */}
          <PropertyCover images={property.images} />

          {/* Core info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={DollarSign}
                label="Precio"
                value={
                  <span className="text-base text-indigo-600 font-bold">
                    {formatUSD(property.price)}
                  </span>
                }
              />

              {property.area != null && (
                <InfoRow icon={Maximize2} label="Área" value={`${property.area} m²`} />
              )}
              {(property.type === 'CASA' || property.type === 'APARTAMENTO') && property.bedrooms != null && (
                <InfoRow icon={Bed} label="Dormitorios" value={property.bedrooms} />
              )}
              {property.type !== 'TERRENO' && property.bathrooms != null && (
                <InfoRow icon={Bath} label="Baños" value={property.bathrooms} />
              )}
              {property.type !== 'TERRENO' && property.parking != null && (
                <InfoRow icon={Car} label="Parqueaderos" value={property.parking} />
              )}

              {(property.sector || property.city || property.address) && (
                <InfoRow
                  icon={MapPin}
                  label="Ubicación"
                  value={
                    <span>
                      {property.address && <span>{property.address}<br /></span>}
                      {[property.sector, property.city].filter(Boolean).join(', ')}
                    </span>
                  }
                />
              )}

              <InfoRow
                icon={Tag}
                label="Publicado por"
                value={property.createdBy.name}
              />
            </CardContent>
          </Card>

          {/* Description */}
          {property.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-700">
                  {property.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Photos upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Fotos de la propiedad</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                propertyId={property.id}
                images={property.images as string[]}
              />
            </CardContent>
          </Card>

          {/* Features */}
          {property.features.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Características</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ubicación en el mapa</CardTitle>
            </CardHeader>
            <CardContent>
              {property.lat != null && property.lng != null ? (
                <>
                  <Suspense fallback={<div className="h-[280px] animate-pulse rounded-xl bg-gray-100" />}>
                    <PropertyMap lat={property.lat} lng={property.lng} title={property.title} />
                  </Suspense>
                  <a
                    href={`https://www.google.com/maps?q=${property.lat},${property.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Ver en Google Maps
                  </a>
                </>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl bg-gray-50 text-gray-400">
                  <MapPin className="h-6 w-6" />
                  <p className="text-sm">Ubicación no disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right — Linked leads ─────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Leads interesados
                  {property.interestedLeads.length > 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      {property.interestedLeads.length}
                    </span>
                  )}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLinkOpen(true)}
                >
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Vincular
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {property.interestedLeads.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sin leads vinculados
                </p>
              ) : (
                <ul className="divide-y">
                  {property.interestedLeads.map((link) => (
                    <li
                      key={link.id}
                      className="flex items-start justify-between gap-2 py-3"
                    >
                      <div
                        className="min-w-0 cursor-pointer"
                        onClick={() => navigate(`/leads/${link.lead.id}`)}
                      >
                        <p className="truncate text-sm font-medium text-gray-900 hover:text-indigo-600">
                          {link.lead.firstName} {link.lead.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{link.lead.phone}</p>
                        {link.notes && (
                          <p className="mt-0.5 text-xs text-gray-400 italic">
                            {link.notes}
                          </p>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 text-gray-400 hover:text-red-500"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Desvincular lead?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará el vínculo entre este lead y la propiedad.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() =>
                                unlinkLead.mutate(link.lead.id)
                              }
                            >
                              Desvincular
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PropertyFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        property={property}
      />
      <PropertyPdfSheet
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        propertyId={property.id}
        propertyTitle={property.title}
      />
      <LinkLeadSheet
        propertyId={id ?? ''}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        linkedLeadIds={linkedLeadIds}
      />
    </div>
  );
}
