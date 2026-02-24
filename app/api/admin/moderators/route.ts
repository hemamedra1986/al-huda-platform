/**
 * API Route: /api/admin/moderators
 * إدارة المشرفين والصلاحيات
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getModerators,
  getModerator,
  createModerator,
  updateModerator,
  addPermissionToModerator,
  removePermissionFromModerator,
  suspendModerator,
  activateModerator,
  deleteModerator,
  type CreateModeratorInput,
  type UpdateModeratorInput,
} from "@/app/lib/services/moderatorService";
import { Role } from "@/app/lib/services/permissionService";

interface RequestBody {
  action?: string;
  moderatorId?: string;
  data?: CreateModeratorInput | UpdateModeratorInput;
  adminRole?: Role;
  adminId?: string;
  permission?: string;
}

export async function GET(request: NextRequest) {
  try {
    const adminRole = request.headers.get("x-admin-role") as Role;
    if (!adminRole || adminRole !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const moderators = await getModerators();
    return NextResponse.json({ success: true, data: moderators });
  } catch (error) {
    console.error("Error fetching moderators:", error);
    return NextResponse.json(
      { error: "فشل جلب المشرفين" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminRole = request.headers.get("x-admin-role") as Role;
    const adminId = request.headers.get("x-admin-id") || "admin";

    if (!adminRole || adminRole !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const body: RequestBody = await request.json();

    switch (body.action) {
      case "create": {
        const result = await createModerator(
          body.data as CreateModeratorInput,
          adminId,
          adminRole
        );
        return NextResponse.json(result, {
          status: result.success ? 201 : 400,
        });
      }

      case "update": {
        if (!body.moderatorId) {
          return NextResponse.json(
            { error: "معرف المشرف مطلوب" },
            { status: 400 }
          );
        }
        const result = await updateModerator(
          body.moderatorId,
          body.data as UpdateModeratorInput,
          adminRole
        );
        return NextResponse.json(result, {
          status: result.success ? 200 : 400,
        });
      }

      case "add-permission": {
        if (!body.moderatorId || !body.permission) {
          return NextResponse.json(
            { error: "معرف المشرف والصلاحية مطلوبة" },
            { status: 400 }
          );
        }
        const result = await addPermissionToModerator(
          body.moderatorId,
          body.permission as any,
          adminRole
        );
        return NextResponse.json(result, {
          status: result.success ? 200 : 400,
        });
      }

      case "remove-permission": {
        if (!body.moderatorId || !body.permission) {
          return NextResponse.json(
            { error: "معرف المشرف والصلاحية مطلوبة" },
            { status: 400 }
          );
        }
        const result = await removePermissionFromModerator(
          body.moderatorId,
          body.permission as any
        );
        return NextResponse.json(result, {
          status: result.success ? 200 : 400,
        });
      }

      case "suspend": {
        if (!body.moderatorId) {
          return NextResponse.json(
            { error: "معرف المشرف مطلوب" },
            { status: 400 }
          );
        }
        const result = await suspendModerator(body.moderatorId);
        return NextResponse.json(result, {
          status: result.success ? 200 : 400,
        });
      }

      case "activate": {
        if (!body.moderatorId) {
          return NextResponse.json(
            { error: "معرف المشرف مطلوب" },
            { status: 400 }
          );
        }
        const result = await activateModerator(body.moderatorId);
        return NextResponse.json(result, {
          status: result.success ? 200 : 400,
        });
      }

      case "delete": {
        if (!body.moderatorId) {
          return NextResponse.json(
            { error: "معرف المشرف مطلوب" },
            { status: 400 }
          );
        }
        const result = await deleteModerator(body.moderatorId);
        return NextResponse.json(result, {
          status: result.success ? 200 : 400,
        });
      }

      default:
        return NextResponse.json(
          { error: "إجراء غير معروف" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in moderator API:", error);
    return NextResponse.json(
      { error: "خطأ في معالجة الطلب" },
      { status: 500 }
    );
  }
}
