"use client";

import Image from "next/image";

export function HeroImage() {
  return (
    <Image
      src="/hero.png"
      alt="Flashlearn application screenshot"
      width={600}
      height={400}
      className="rounded-lg object-cover"
    />
  );
}
