export type Screen = 'login' | 'register' | 'recovery' | 'reset';
export type NoticeKind = 'success' | 'error' | 'info';

export interface Notice {
  kind: NoticeKind;
  title: string;
  message: string;
}

export interface FieldErrors {
  [name: string]: string;
}

export interface AuthResponse {
  displayName: string;
  roles: string[];
}
