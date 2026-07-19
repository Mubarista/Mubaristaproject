import Image from "next/image";

export function MtnMomoIcon({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/images/momopay.png"
      alt="MomoPay"
      width={48}
      height={32}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
