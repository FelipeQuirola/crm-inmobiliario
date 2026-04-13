export interface FacebookLeadChange {
  value: {
    form_id: string;
    leadgen_id: string;
    page_id: string;
    adgroup_id?: string;
    ad_id?: string;
  };
  field: string;
}

export interface FacebookEntry {
  id: string;
  changes: FacebookLeadChange[];
}

export interface FacebookWebhookBody {
  object: string;
  entry: FacebookEntry[];
}

export interface FacebookFieldData {
  name: string;
  values: string[];
}

export interface FacebookLeadData {
  id: string;
  field_data: FacebookFieldData[];
  created_time: number;
  ad_id?: string;
  form_id: string;
  page_id: string;
}
