export class QuotaInfoDto {
  usedBytes: bigint;
  totalBytes: bigint;
  usedPercentage: number;
  plan: 'FREE' | 'PRO';
}
