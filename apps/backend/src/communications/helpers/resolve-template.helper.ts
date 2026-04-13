import { Decimal } from '@prisma/client/runtime/library';

function formatBudget(budget: Decimal | null | undefined): string {
  if (budget == null) return '';
  const num = Number(budget);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export interface ResolveContext {
  firstName:        string;
  lastName:         string;
  phone:            string;
  email?:           string | null;
  assignedTo?:      { name: string } | null;
  propertyInterest?: string | null;
  budget?:          Decimal | null;
}

export function resolveTemplate(body: string, lead: ResolveContext): string {
  return body
    .replace(/\{\{nombre\}\}/g,    lead.firstName)
    .replace(/\{\{apellido\}\}/g,  lead.lastName)
    .replace(/\{\{telefono\}\}/g,  lead.phone)
    .replace(/\{\{email\}\}/g,     lead.email ?? '')
    .replace(/\{\{vendedor\}\}/g,  lead.assignedTo?.name ?? 'Sin asignar')
    .replace(/\{\{propiedad\}\}/g, lead.propertyInterest ?? '')
    .replace(/\{\{precio\}\}/g,    formatBudget(lead.budget));
}
