import { NextRequest, NextResponse } from "next/server";
import { authenticatePublicApi, recordApiCall } from "@/src/api/auth";
import { handlePublicAnalyticsGET } from "@/src/api/handlers/analytics";