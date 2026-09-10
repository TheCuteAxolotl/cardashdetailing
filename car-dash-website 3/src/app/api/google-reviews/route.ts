import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GOOGLE_REVIEW_URL = "https://g.page/r/CXj-njnM1fyvEAI/review";

type GoogleReview = {
  name?: string;
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string; languageCode?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
  googleMapsUri?: string;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
};

type GooglePlaceResponse = {
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GoogleReview[];
  attributions?: Array<{ provider?: string; providerUri?: string }>;
};

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return NextResponse.json(
      { error: "Google review integration is not configured." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "displayName,rating,userRatingCount,googleMapsUri,reviews,attributions",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("Google Places API error:", response.status, body);
      return NextResponse.json(
        { error: "Unable to load Google reviews right now." },
        { status: 502 }
      );
    }

    const place = (await response.json()) as GooglePlaceResponse;

    const reviews = (place.reviews ?? []).map((review, index) => ({
      id: review.name ?? `google-review-${index}`,
      author: review.authorAttribution?.displayName ?? "Google reviewer",
      authorProfileUrl: review.authorAttribution?.uri ?? null,
      authorPhotoUrl: review.authorAttribution?.photoUri ?? null,
      rating: review.rating ?? 5,
      text: review.text?.text ?? review.originalText?.text ?? "",
      relativeTime: review.relativePublishTimeDescription ?? null,
      publishTime: review.publishTime ?? null,
      googleMapsUri: review.googleMapsUri ?? place.googleMapsUri ?? GOOGLE_REVIEW_URL,
    }));

    return NextResponse.json(
      {
        businessName: place.displayName?.text ?? "Car Dash Detailing",
        rating: place.rating ?? null,
        reviewCount: place.userRatingCount ?? null,
        googleMapsUri: place.googleMapsUri ?? GOOGLE_REVIEW_URL,
        reviewUrl: GOOGLE_REVIEW_URL,
        reviews,
        attributions: place.attributions ?? [],
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Google review fetch failed:", error);
    return NextResponse.json(
      { error: "Unable to load Google reviews right now." },
      { status: 500 }
    );
  }
}
