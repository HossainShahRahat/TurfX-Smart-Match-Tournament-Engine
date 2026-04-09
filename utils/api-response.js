import { NextResponse } from "next/server";

export function successResponse(data, message = "Request completed successfully.", status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(error, fallbackMessage = "Something went wrong.") {
  return NextResponse.json(
    {
      success: false,
      data: null,
      message: error.message || fallbackMessage,
    },
    { status: error.statusCode || 500 }
  );
}
