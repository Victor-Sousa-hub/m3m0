export type ThemeColors = {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  placeholder: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
};

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f7f7f8',
  border: '#dcdcdc',
  text: '#1a1a1a',
  textMuted: '#6b7280',
  placeholder: '#9aa0aa',
  primary: '#2f6feb',
  primarySoft: '#eaf1fd',
  primaryText: '#ffffff',
  success: '#2e9e5b',
  successSoft: '#e6f6ec',
  danger: '#c0392b',
  dangerSoft: '#fbeaea',
};

export const darkColors: ThemeColors = {
  background: '#0f1115',
  surface: '#1a1d23',
  border: '#2c303a',
  text: '#f2f3f5',
  textMuted: '#9aa0aa',
  placeholder: '#6b7280',
  primary: '#5b8dff',
  primarySoft: '#1b2740',
  primaryText: '#ffffff',
  success: '#4ade80',
  successSoft: '#153521',
  danger: '#f87171',
  dangerSoft: '#3a1c1c',
};
