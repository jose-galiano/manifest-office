// `/api/desk` request and response shapes. The desk is the trip-brief →
// kit-manifest Gemini endpoint, layered behind seven security gates.

export type DeskRequest = {
  brief: string;
  honey?: string;
  turnstile?: string;
};

export type DeskItem = {
  handle: string;
  title: string;
  price: number;
};

export type DeskResponse = {
  raw: string;
  re: string;
  allocation: string;
  forecast: string;
  note: string;
  total: string;
  items: DeskItem[];
  model_used: string;
  timestamp: string;
  cached?: boolean;
};

export type DeskHoneypotResponse = {
  re: string;
  allocation: string;
  forecast: string;
  note: string;
  total: string;
  items: DeskItem[];
};
