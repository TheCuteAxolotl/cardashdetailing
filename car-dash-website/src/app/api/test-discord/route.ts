import { NextResponse } from "next/server";

export async function GET() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "DISCORD_WEBHOOK_URL is missing" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  content:
    "<@&1547633528873943102> New detailing request received!",
  allowed_mentions: {
    roles: ["1547633528873943102"],
  },
}),

    if (!response.ok) {
      const text = await response.text();

      return NextResponse.json(
        {
          success: false,
          status: response.status,
          response: text,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Discord test sent",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Discord error",
      },
      { status: 500 }
    );
  }
}
