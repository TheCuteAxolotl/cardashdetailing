// Before/after pairs for the homepage comparison slider.
//
// Each gallery photo listed here is a side-by-side collage (before on the
// left, after on the right). The crop boxes pick out each half as fractions of
// the full photo: [left, top, right, bottom]. All crops share a 4:5 shape.
export type CropBox = [number, number, number, number];

export type BeforeAfterPair = {
  key: string;
  imageId: string;
  label: string;
  caption: string;
  before: CropBox;
  after: CropBox;
};

export const BEFORE_AFTER_PAIRS: BeforeAfterPair[] = [
  { key: "floor-mats", imageId: "cmvxwotqv000011upjd3d8hqc", label: "Floor mats", caption: "Driver side interior detail", before: [0.0066, 0.33, 0.4917, 0.9365], after: [0.5066, 0.33, 0.9917, 0.9365] },
  { key: "carpet", imageId: "cmuuujnms00022iad5n4pehsr", label: "Carpet", caption: "Stained front carpet, deep cleaned", before: [0.067, 0.536, 0.4288, 0.9883], after: [0.5779, 0.536, 0.9397, 0.9883] },
  { key: "cloth-seats", imageId: "cmuuuir9a00012iadpblholr5", label: "Cloth seats", caption: "Cloth seat deep clean", before: [0.0084, 0.3183, 0.4774, 0.9045], after: [0.5151, 0.3183, 0.9841, 0.9045] },
  { key: "interior", imageId: "cmtu6m9ju0000x692q43z0yq5", label: "Interior", caption: "Full interior detail", before: [0.0098, 0.3922, 0.4739, 0.9722], after: [0.5114, 0.3922, 0.9755, 0.9722] },
  { key: "leather", imageId: "cmuuuc5fu00002z4xknmw9kr1", label: "Leather", caption: "Leather interior detail", before: [0.0099, 0.3465, 0.4719, 0.9241], after: [0.5182, 0.3465, 0.9802, 0.9241] },
  { key: "paint", imageId: "cmuuulcgl00042iadzzq0oso0", label: "Paint", caption: "Paint finish, polished", before: [0.0093, 0.2576, 0.4744, 0.8431], after: [0.5116, 0.2576, 0.9767, 0.8431] },
];
