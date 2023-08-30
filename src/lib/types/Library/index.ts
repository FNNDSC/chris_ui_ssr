export interface File {
  creation_date: string;
  fname: string;
  fsize: number;
}

export interface InputProps {
  style: string;
  type: string;
}

export interface PreviewPayload {
  type: string;
  payload?: any;
  currentIndex?: number;
}
