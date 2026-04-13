import { formatUSD } from './utils';

export interface TemplateContext {
  firstName:        string;
  lastName:         string;
  phone:            string;
  email?:           string | null;
  assignedTo?:      { name: string } | null;
  propertyInterest?: string | null;
  budget?:          number | null;
}

export function resolveTemplate(body: string, lead: TemplateContext): string {
  return body
    .replace(/\{\{nombre\}\}/g,    lead.firstName)
    .replace(/\{\{apellido\}\}/g,  lead.lastName)
    .replace(/\{\{telefono\}\}/g,  lead.phone)
    .replace(/\{\{email\}\}/g,     lead.email ?? '')
    .replace(/\{\{vendedor\}\}/g,  lead.assignedTo?.name ?? 'Sin asignar')
    .replace(/\{\{propiedad\}\}/g, lead.propertyInterest ?? '')
    .replace(/\{\{precio\}\}/g,    formatUSD(lead.budget) ?? '');
}

export const TEMPLATE_VARIABLES = [
  { variable: '{{nombre}}',    label: 'Nombre' },
  { variable: '{{apellido}}',  label: 'Apellido' },
  { variable: '{{telefono}}',  label: 'Teléfono' },
  { variable: '{{email}}',     label: 'Email' },
  { variable: '{{vendedor}}',  label: 'Vendedor' },
  { variable: '{{propiedad}}', label: 'Propiedad' },
  { variable: '{{precio}}',    label: 'Precio' },
] as const;
