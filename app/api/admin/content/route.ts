/**
 * API Route: /api/admin/content
 * إدارة محتوى الموقع (سور، دروس، إلخ)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getSurahs,
  getSurah,
  createSurah,
  updateSurah,
  deleteSurah,
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseLessons,
  createLesson,
  deleteLesson,
  type CreateSurahInput,
  type UpdateSurahInput,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "@/app/lib/services/contentManagementService";
import { Role } from "@/app/lib/services/permissionService";

interface RequestBody {
  action?: string;
  type?: "surah" | "course" | "lesson";
  id?: string;
  courseId?: string;
  data?: any;
  userId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const adminRole = request.headers.get("x-admin-role") as Role;
    if (!adminRole) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const courseId = searchParams.get("courseId");

    if (type === "surah") {
      if (id) {
        const surah = await getSurah(id);
        return NextResponse.json({ success: true, data: surah });
      } else {
        const surahs = await getSurahs();
        return NextResponse.json({ success: true, data: surahs });
      }
    }

    if (type === "course") {
      if (id) {
        const course = await getCourse(id);
        return NextResponse.json({ success: true, data: course });
      } else {
        const courses = await getCourses();
        return NextResponse.json({ success: true, data: courses });
      }
    }

    if (type === "lesson" && courseId) {
      const lessons = await getCourseLessons(courseId);
      return NextResponse.json({ success: true, data: lessons });
    }

    return NextResponse.json(
      { error: "نوع محتوى أو معاملات غير صحيحة" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "فشل جلب المحتوى" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminRole = request.headers.get("x-admin-role") as Role;
    const userId = request.headers.get("x-user-id") || "admin";

    if (!adminRole || adminRole === "user") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لإضافة محتوى" },
        { status: 401 }
      );
    }

    const body: RequestBody = await request.json();

    switch (body.type) {
      case "surah": {
        if (body.action === "create") {
          const surah = await createSurah(body.data as CreateSurahInput, userId);
          return NextResponse.json(
            { success: true, data: surah },
            { status: 201 }
          );
        }
        break;
      }

      case "course": {
        if (body.action === "create") {
          const course = await createCourse(body.data as CreateCourseInput, userId);
          return NextResponse.json(
            { success: true, data: course },
            { status: 201 }
          );
        }
        break;
      }

      case "lesson": {
        if (body.action === "create" && body.courseId) {
          const lesson = await createLesson(
            body.courseId,
            body.data,
            userId
          );
          return NextResponse.json(
            { success: true, data: lesson },
            { status: 201 }
          );
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: "إجراء أو نوع غير معروف" },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: "فشل إنشاء المحتوى" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating content:", error);
    return NextResponse.json(
      { error: "خطأ في معالجة الطلب" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminRole = request.headers.get("x-admin-role") as Role;

    if (!adminRole || adminRole === "user") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لتعديل محتوى" },
        { status: 401 }
      );
    }

    const body: RequestBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "معرف المحتوى مطلوب" },
        { status: 400 }
      );
    }

    switch (body.type) {
      case "surah": {
        const result = await updateSurah(
          body.id,
          body.data as UpdateSurahInput,
          "admin"
        );
        return NextResponse.json({
          success: result !== null,
          data: result,
        });
      }

      case "course": {
        const result = await updateCourse(
          body.id,
          body.data as UpdateCourseInput,
          "admin"
        );
        return NextResponse.json({
          success: result !== null,
          data: result,
        });
      }

      default:
        return NextResponse.json(
          { error: "نوع محتوى غير معروف" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "خطأ في معالجة الطلب" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminRole = request.headers.get("x-admin-role") as Role;

    if (!adminRole || adminRole === "user") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لحذف محتوى" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "معرف المحتوى مطلوب" },
        { status: 400 }
      );
    }

    let success = false;

    switch (type) {
      case "surah":
        success = await deleteSurah(id);
        break;
      case "course":
        success = await deleteCourse(id);
        break;
      case "lesson":
        success = await deleteLesson(id);
        break;
    }

    if (!success) {
      return NextResponse.json(
        { error: "لم يتم العثور على المحتوى" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف المحتوى بنجاح",
    });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { error: "خطأ في معالجة الطلب" },
      { status: 500 }
    );
  }
}
