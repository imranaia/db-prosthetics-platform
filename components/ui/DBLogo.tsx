/**
 * DB Prosthetics and Orthotics Ltd — Logo mark
 */

import Image from 'next/image';

interface Props {
  size?: number;
}

export default function DBLogo({ size = 48 }: Props) {
  return (
    <Image
      src="/assets/logo.png"
      alt="DB Prosthetics and Orthotics Ltd"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}
