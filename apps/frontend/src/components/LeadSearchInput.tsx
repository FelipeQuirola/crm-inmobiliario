import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { leadsService } from '@/services/leads.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Lead } from '@/types';

type LeadSummary = Pick<Lead, 'id' | 'firstName' | 'lastName' | 'phone'>;

interface LeadSearchInputProps {
  /** Currently selected lead id (controlled) */
  value:        string;
  onChange:     (leadId: string) => void;
  /** Pre-select this lead on mount / when it changes (e.g. edit mode) */
  initialLead?: LeadSummary | null;
}

export function LeadSearchInput({ value, onChange, initialLead }: LeadSearchInputProps) {
  const [inputText, setInputText]   = useState('');
  const [dropdownOpen, setDropdown] = useState(false);
  const [selectedLead, setSelected] = useState<LeadSummary | null>(initialLead ?? null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync when initialLead changes (sheet reopened with a different event)
  useEffect(() => {
    setSelected(initialLead ?? null);
  }, [initialLead]);

  const debouncedSearch = useDebounce(inputText, 400);

  const { data, isFetching } = useQuery({
    queryKey: ['leadSearch', debouncedSearch],
    queryFn:  () =>
      leadsService
        .list({ search: debouncedSearch, limit: 10 })
        .then((r) => r.data.data),
    enabled:      debouncedSearch.length >= 2,
    staleTime:    1000 * 30,
    placeholderData: (prev) => prev,
  });

  const results: Lead[] = data ?? [];

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelect = (lead: Lead) => {
    setSelected(lead);
    onChange(lead.id);
    setInputText('');
    setDropdown(false);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setInputText('');
  };

  const handleBlur = () => {
    // Delay so click on dropdown item fires before close
    setTimeout(() => setDropdown(false), 200);
  };

  // ── Render: selected state ────────────────────────────────────────────────

  if (value && selectedLead) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2">
        <span className="flex-1 text-sm font-medium text-gray-800">
          {selectedLead.firstName} {selectedLead.lastName}
          <span className="ml-2 text-xs font-normal text-gray-500">{selectedLead.phone}</span>
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ── Render: search state ──────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          placeholder="Buscar por nombre o teléfono..."
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setDropdown(true);
          }}
          onFocus={() => { if (inputText.length >= 2) setDropdown(true); }}
          onBlur={handleBlur}
          className="text-sm"
          autoComplete="off"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {dropdownOpen && debouncedSearch.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {results.length === 0 && !isFetching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Sin resultados para "{debouncedSearch}"
            </p>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {results.map((lead) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                    onClick={() => handleSelect(lead)}
                  >
                    <span className="font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">{lead.phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
