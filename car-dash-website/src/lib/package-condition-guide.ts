export type PackageGuideKind = "packages" | "exterior" | "interior";

const COPY: Record<PackageGuideKind, Record<string, string>> = {
  packages: {
    essential: "Best when the vehicle is already maintained and mainly has light dust, crumbs, fingerprints, and normal road grime.",
    complete: "Best when dirt has built up inside and out, the cabin needs a more detailed clean, or the paint needs decontamination and fresh protection.",
    signature: "Best when the car needs a full detail and the paint also looks dull, hazy, or lightly swirled and you want more gloss and clarity.",
  },
  exterior: {
    "maintenance-wash": "Best when the exterior is already in good condition and mainly has normal dust, pollen, bugs, and road film.",
    "full-exterior": "Best when the paint feels rough, has more road grime or contamination, and needs a deeper clean plus fresh protection.",
    "paint-enhancement": "Best when the exterior is cleanable but the paint looks dull, hazy, or lightly swirled and you want a noticeable gloss improvement.",
  },
  interior: {
    "interior-refresh": "Best when the interior is already kept up and mainly has light dust, crumbs, fingerprints, and normal everyday mess.",
    "full-interior": "Best when the cabin has visible buildup, dirt in crevices, dirty seats or mats, and needs more than a quick wipe-down.",
    "deep-reset": "Best when the interior has stains, heavier buildup, neglected carpets or seats, odor concerns, or needs extraction and extended cleaning time.",
  },
};

export function getPackageConditionGuide(kind: PackageGuideKind, packageId: string, fallbackDescription: string) {
  return COPY[kind]?.[packageId] || fallbackDescription;
}
