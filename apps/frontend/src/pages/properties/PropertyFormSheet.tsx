import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Images } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { toast } from 'sonner';
import { useCreateProperty, useUpdateProperty } from '@/hooks/useProperties';

const PropertyMap = lazy(() =>
  import('@/components/ui/PropertyMap').then((m) => ({ default: m.PropertyMap }))
);
import type { Property, PropertyType } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

// All fields optional — required-field validation is done manually in onSubmit.
// Numeric fields are plain z.number().optional() — conversion from string is
// handled by setValueAs in register() calls so Zod never sees a raw string.
const propertySchema = z.object({
  title:       z.string().optional(),
  type:        z.string().optional(),
  status:      z.string().optional(),
  price:       z.number().optional(),
  description: z.string().optional(),
  area:        z.number().optional(),
  bedrooms:    z.number().optional(),
  bathrooms:   z.number().optional(),
  parking:     z.number().optional(),
  address:     z.string().optional(),
  city:        z.string().optional(),
  sector:      z.string().optional(),
  lat:         z.number().optional(),
  lng:         z.number().optional(),
  features:    z.array(z.string()).optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

// ─── Field visibility per type ────────────────────────────────────────────────

function fieldConfig(type: PropertyType) {
  return {
    showArea:      true,
    showBedrooms:  type === 'CASA' || type === 'APARTAMENTO',
    showBathrooms: type !== 'TERRENO',
    showParking:   type !== 'TERRENO',
  };
}

// ─── Feature suggestions ──────────────────────────────────────────────────────

const FEATURE_SUGGESTIONS = [
  'Piscina', 'Jardín', 'Gimnasio', 'Seguridad 24h',
  'BBQ', 'Cuarto de servicio', 'Bodega', 'Vista panorámica',
];

// ─── Default values ───────────────────────────────────────────────────────────

function buildCreateDefaults(): PropertyFormValues {
  return {
    title:    '',
    type:     'CASA',
    status:   'DISPONIBLE',
    features: [],
  };
}

function buildEditDefaults(property: Property): PropertyFormValues {
  return {
    title:       property.title,
    type:        property.type,
    status:      property.status,
    price:       property.price,
    description: property.description ?? '',
    area:        property.area ?? undefined,
    bedrooms:    property.bedrooms ?? undefined,
    bathrooms:   property.bathrooms ?? undefined,
    parking:     property.parking ?? undefined,
    address:     property.address ?? '',
    city:        property.city ?? '',
    sector:      property.sector ?? '',
    lat:         property.lat ?? undefined,
    lng:         property.lng ?? undefined,
    features:    property.features ?? [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PropertyFormSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property?: Property;
}

export function PropertyFormSheet({ open, onOpenChange, property }: PropertyFormSheetProps) {
  const isEdit = !!property;
  const navigate = useNavigate();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty(property?.id ?? '');

  const [chipInput, setChipInput] = useState('');
  const [step, setStep] = useState<'form' | 'images'>('form');
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: isEdit && property ? buildEditDefaults(property) : buildCreateDefaults(),
  });

  const type     = (form.watch('type') ?? 'CASA') as PropertyType;
  const fields   = fieldConfig(type);
  const features = (form.watch('features') ?? []) as string[];
  const mapLat   = form.watch('lat') as number | undefined;
  const mapLng   = form.watch('lng') as number | undefined;
  const showMap  = mapLat != null && !isNaN(mapLat) && mapLng != null && !isNaN(mapLng);

  // Reset when sheet opens/closes
  useEffect(() => {
    if (open) {
      form.reset(isEdit && property ? buildEditDefaults(property) : buildCreateDefaults());
      setChipInput('');
      setStep('form');
      setCreatedPropertyId(null);
    }
  }, [open, property, isEdit, form]);

  // ── Feature chip helpers ────────────────────────────────────────────────────

  const addChip = (value: string) => {
    const val = value.trim();
    if (!val || features.includes(val)) return;
    form.setValue('features', [...features, val]);
    setChipInput('');
  };

  const removeChip = (chip: string) => {
    form.setValue('features', features.filter((f) => f !== chip));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit = async (values: PropertyFormValues) => {
    const resolvedType = (values.type ?? 'CASA') as PropertyType;
    const fc = fieldConfig(resolvedType);

    if (isEdit) {
      // Build payload: strip undefined, empty strings, and NaN; respect field visibility
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v === undefined || v === null) continue;
        if (typeof v === 'string' && v === '') continue;
        if (typeof v === 'number' && isNaN(v)) continue;
        payload[k] = v;
      }
      if (!fc.showBedrooms)  delete payload['bedrooms'];
      if (!fc.showBathrooms) delete payload['bathrooms'];
      if (!fc.showParking)   delete payload['parking'];

      await updateProperty.mutateAsync(payload);
      onOpenChange(false);
    } else {
      // Manual required-field check for create mode
      let hasError = false;
      if (!values.title?.trim()) { form.setError('title', { message: 'El título es requerido' }); hasError = true; }
      if (!values.type)          { form.setError('type',  { message: 'El tipo es requerido' });   hasError = true; }
      if (!values.status)        { form.setError('status',{ message: 'El estado es requerido' }); hasError = true; }
      if (!values.price)         { form.setError('price', { message: 'El precio es requerido' }); hasError = true; }
      if (hasError) return;

      const payload = {
        title:       values.title as string,
        type:        values.type  as PropertyType,
        status:      values.status as 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA' | 'INACTIVA',
        price:       values.price as number,
        description: values.description || undefined,
        area:        fc.showArea      ? values.area      : undefined,
        bedrooms:    fc.showBedrooms  ? values.bedrooms  : undefined,
        bathrooms:   fc.showBathrooms ? values.bathrooms : undefined,
        parking:     fc.showParking   ? values.parking   : undefined,
        address:     values.address   || undefined,
        city:        values.city      || undefined,
        sector:      values.sector    || undefined,
        lat:         values.lat,
        lng:         values.lng,
        features:    values.features  ?? [],
      };
      const created = await createProperty.mutateAsync(payload);
      setCreatedPropertyId(created.id);
      setStep('images');
    }
  };

  const handleFinish = () => {
    onOpenChange(false);
    if (createdPropertyId) {
      navigate(`/propiedades/${createdPropertyId}`);
    }
  };

  const isPending = createProperty.isPending || updateProperty.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {step === 'images' ? 'Agrega fotos de la propiedad' : isEdit ? 'Editar propiedad' : 'Nueva propiedad'}
          </SheetTitle>
        </SheetHeader>

        {/* ── Step 2: Image upload after creation ──────────────────────── */}
        {step === 'images' && createdPropertyId && (
          <div className="space-y-5 pb-6">
            <p className="text-sm text-muted-foreground">
              Las fotos ayudan a los clientes a conocer mejor la propiedad. Este paso es opcional, puedes hacerlo después.
            </p>

            <ImageUploader propertyId={createdPropertyId} images={[]} />

            <div className="border-t pt-4">
              <Button className="w-full bg-[#006031] hover:bg-[#004d26] text-white" onClick={handleFinish}>
                <Images className="mr-2 h-4 w-4" />
                Finalizar
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 1: Property form ─────────────────────────────────────── */}
        {step === 'form' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">

              {/* ── Información básica ──────────────────────────────── */}
              <section className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Información básica
                </p>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Casa en Cumbayá con jardín" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(['CASA','APARTAMENTO','TERRENO','OFICINA','LOCAL','BODEGA'] as const).map((t) => (
                              <SelectItem key={t} value={t}>
                                {t.charAt(0) + t.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                            <SelectItem value="RESERVADA">Reservada</SelectItem>
                            <SelectItem value="VENDIDA">Vendida</SelectItem>
                            <SelectItem value="INACTIVA">Inactiva</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio (USD) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="150000"
                          value={field.value ?? ''}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* ── Características (dinámicas por tipo) ────────────── */}
              <section className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Características
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {fields.showArea && (
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área (m²)</FormLabel>
                          <FormControl>
                            <Input
                              type="number" min={0} placeholder="120"
                              value={field.value ?? ''}
                              onBlur={field.onBlur} name={field.name} ref={field.ref}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {fields.showBedrooms && (
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dormitorios</FormLabel>
                          <FormControl>
                            <Input
                              type="number" min={0} placeholder="3"
                              value={field.value ?? ''}
                              onBlur={field.onBlur} name={field.name} ref={field.ref}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {fields.showBathrooms && (
                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Baños</FormLabel>
                          <FormControl>
                            <Input
                              type="number" min={0} placeholder="2"
                              value={field.value ?? ''}
                              onBlur={field.onBlur} name={field.name} ref={field.ref}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {fields.showParking && (
                    <FormField
                      control={form.control}
                      name="parking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parqueaderos</FormLabel>
                          <FormControl>
                            <Input
                              type="number" min={0} placeholder="1"
                              value={field.value ?? ''}
                              onBlur={field.onBlur} name={field.name} ref={field.ref}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </section>

              {/* ── Ubicación ───────────────────────────────────────── */}
              <section className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ubicación
                </p>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Principal y Calle 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input placeholder="Quito" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <FormControl>
                          <Input placeholder="Cumbayá" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input
                            type="number" step="any" placeholder="-0.1807"
                            value={field.value ?? ''}
                            onBlur={field.onBlur} name={field.name} ref={field.ref}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input
                            type="number" step="any" placeholder="-78.4678"
                            value={field.value ?? ''}
                            onBlur={field.onBlur} name={field.name} ref={field.ref}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtén las coordenadas en{' '}
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-500 underline"
                  >
                    Google Maps
                  </a>{' '}
                  (clic derecho → ¿Qué hay aquí?)
                </p>

                {showMap && (
                  <Suspense fallback={<div className="h-[200px] animate-pulse rounded-xl bg-gray-100" />}>
                    <PropertyMap lat={mapLat as number} lng={mapLng as number} height={200} />
                  </Suspense>
                )}
              </section>

              {/* ── Descripción ─────────────────────────────────────── */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        className="resize-none"
                        placeholder="Descripción detallada de la propiedad..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Características adicionales (chips) ─────────────── */}
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Características adicionales
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ej. Piscina, Jardín..."
                    value={chipInput}
                    onChange={(e) => setChipInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChip(chipInput);
                      }
                    }}
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => addChip(chipInput)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {FEATURE_SUGGESTIONS.filter((s) => !features.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addChip(s)}
                      className="rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                {features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => removeChip(f)}
                          className="hover:text-indigo-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Actions ─────────────────────────────────────────── */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? 'Guardando...'
                    : isEdit
                    ? 'Guardar cambios'
                    : 'Continuar →'}
                </Button>
              </div>

            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
