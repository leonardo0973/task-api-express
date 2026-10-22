export interface FieldIssue {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: FieldIssue[];
  requestId?: string;
}
