import { createHash } from 'crypto';

const PROPERTIES = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];

export function buildWompiEvent(params: {
  reference: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  amountCents: number;
  transactionId?: string;
  secret?: string;
}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const transaction = {
    id: params.transactionId ?? `wompi-txn-${Date.now()}`,
    reference: params.reference,
    status: params.status,
    amount_in_cents: params.amountCents,
  };
  const data = { transaction };
  const secret = params.secret ?? process.env.WOMPI_EVENTS_SECRET ?? '';

  const concatenated = PROPERTIES.map((path) =>
    String(path.split('.').reduce<any>((acc, key) => acc[key], data)),
  ).join('');

  const checksum = createHash('sha256')
    .update(`${concatenated}${timestamp}${secret}`)
    .digest('hex');

  return {
    event: 'transaction.updated',
    data,
    timestamp,
    signature: { properties: PROPERTIES, checksum },
  };
}
