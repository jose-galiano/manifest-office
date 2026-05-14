// `/api/reserve` request and response shapes.

export type ReserveRequest = {
  handle: string;
  engraving?: string | null;
  // The client sends the fee it expects to pay; the server re-derives this
  // value from a trusted constant (anti-tamper). See lib/services/reserve-product.ts.
  engraving_fee?: number;
};

export type ReserveSuccessResponse = {
  handle: string;
  title: string;
  issue: number;
  total: number;
  issued_label: string;
  remaining: number;
  inventory_after: number | null;
  engraving: string | null;
  engraving_fee: number;
  timestamp: string;
};

export type ReserveSoldOutResponse = {
  issued: number;
  total: number;
  sold_out: true;
  message: string;
};

export type ReserveResponse = ReserveSuccessResponse | ReserveSoldOutResponse;
