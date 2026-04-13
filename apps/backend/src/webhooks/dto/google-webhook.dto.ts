export interface GoogleUserColumnData {
  column_name: string;
  string_value?: string;
}

export interface GoogleWebhookBody {
  google_key: string;
  user_column_data: GoogleUserColumnData[];
  campaign_id?: string;
  form_id?: string;
  gcl_id?: string;
  submission_id?: string;
}
