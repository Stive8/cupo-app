export interface WompiTransaction {
  id: string;
  reference: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  amount_in_cents: number;
}

export interface WompiEvent {
  event: string;
  data: {
    transaction: WompiTransaction;
  };
  timestamp: number;
  signature: {
    properties: string[];
    checksum: string;
  };
}
