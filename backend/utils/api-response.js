import { NextResponse } from "next/server";

export function successResponse(
  data,
  message = "Request completed successfully.",
  status = 200,
) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status },
  );
}

export function errorResponse(
  error,
  fallbackMessage = "Something went wrong.",
) {
  // Log server-side error details to help debugging during development.
  try {
    if (error instanceof Error) {
      console.error("API error:", error.stack || error.message);
    } else {
      console.error("API error:", JSON.stringify(error));
    }
  } catch (logErr) {
    // ignore logging errors
  }

  return NextResponse.json(
    {
      success: false,
      data: null,
      message: error?.message || fallbackMessage,
    },
    { status: error?.statusCode || 500 },
  );
}
