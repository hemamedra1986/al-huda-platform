/**
 * Content Management Service - إدارة المحتوى
 * CRUD operations for Quran chapters, courses, lessons, etc.
 */

export type ContentType = "surah" | "course" | "lesson" | "donation" | "consultation";

export interface QuranSurah {
  id: string;
  number: number;
  name: string;
  nameArabic: string;
  verses: number;
  revelationType: "Meccan" | "Medinan";
  audioUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Course {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  instructor: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  isPublished: boolean;
  thumbnail?: string;
  lessons: string[]; // lesson IDs
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  titleArabic: string;
  description: string;
  videoUrl?: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateSurahInput {
  number: number;
  name: string;
  nameArabic: string;
  verses: number;
  revelationType: "Meccan" | "Medinan";
  audioUrl?: string;
  description?: string;
}

export interface UpdateSurahInput {
  name?: string;
  nameArabic?: string;
  audioUrl?: string;
  description?: string;
}

export interface CreateCourseInput {
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  instructor: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  thumbnail?: string;
}

export interface UpdateCourseInput {
  title?: string;
  titleArabic?: string;
  description?: string;
  descriptionArabic?: string;
  instructor?: string;
  level?: "beginner" | "intermediate" | "advanced";
  price?: number;
  thumbnail?: string;
  isPublished?: boolean;
}

// Mock data for content
const mockSurahs: QuranSurah[] = Array.from({ length: 114 }, (_, i) => ({
  id: `surah-${i + 1}`,
  number: i + 1,
  name: `Surah ${i + 1}`,
  nameArabic: `سورة ${i + 1}`,
  verses: Math.floor(Math.random() * 286) + 1,
  revelationType: i < 86 ? "Meccan" : "Medinan",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: "system",
}));

const mockCourses: Course[] = [
  {
    id: "course-1",
    title: "Quran Fundamentals",
    titleArabic: "أساسيات القرآن",
    description: "Learn the basics of Quranic recitation",
    descriptionArabic: "تعلم أساسيات التجويد القرآني",
    instructor: "Sheikh Ahmed",
    level: "beginner",
    price: 29.99,
    isPublished: true,
    lessons: ["lesson-1", "lesson-2"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "admin",
  },
];

const mockLessons: Lesson[] = [
  {
    id: "lesson-1",
    courseId: "course-1",
    title: "Introduction to Quran",
    titleArabic: "مقدمة إلى القرآن الكريم",
    description: "Basic introduction",
    content: "Welcome to the course...",
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "admin",
  },
];

/**
 * Get all surahs
 */
export async function getSurahs(): Promise<QuranSurah[]> {
  return mockSurahs;
}

/**
 * Get surah by ID
 */
export async function getSurah(id: string): Promise<QuranSurah | null> {
  return mockSurahs.find((s) => s.id === id) || null;
}

/**
 * Create new surah
 */
export async function createSurah(
  input: CreateSurahInput,
  userId: string
): Promise<QuranSurah> {
  const surah: QuranSurah = {
    id: `surah-${Date.now()}`,
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId,
  };
  mockSurahs.push(surah);
  return surah;
}

/**
 * Update surah
 */
export async function updateSurah(
  id: string,
  input: UpdateSurahInput,
  userId: string
): Promise<QuranSurah | null> {
  const surah = mockSurahs.find((s) => s.id === id);
  if (!surah) return null;

  const updated: QuranSurah = {
    ...surah,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  const index = mockSurahs.indexOf(surah);
  mockSurahs[index] = updated;
  return updated;
}

/**
 * Delete surah
 */
export async function deleteSurah(id: string): Promise<boolean> {
  const index = mockSurahs.findIndex((s) => s.id === id);
  if (index === -1) return false;
  mockSurahs.splice(index, 1);
  return true;
}

/**
 * Get all courses
 */
export async function getCourses(): Promise<Course[]> {
  return mockCourses;
}

/**
 * Get course by ID
 */
export async function getCourse(id: string): Promise<Course | null> {
  return mockCourses.find((c) => c.id === id) || null;
}

/**
 * Create new course
 */
export async function createCourse(
  input: CreateCourseInput,
  userId: string
): Promise<Course> {
  const course: Course = {
    id: `course-${Date.now()}`,
    ...input,
    lessons: [],
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId,
  };
  mockCourses.push(course);
  return course;
}

/**
 * Update course
 */
export async function updateCourse(
  id: string,
  input: UpdateCourseInput,
  userId: string
): Promise<Course | null> {
  const course = mockCourses.find((c) => c.id === id);
  if (!course) return null;

  const updated: Course = {
    ...course,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  const index = mockCourses.indexOf(course);
  mockCourses[index] = updated;
  return updated;
}

/**
 * Delete course
 */
export async function deleteCourse(id: string): Promise<boolean> {
  const index = mockCourses.findIndex((c) => c.id === id);
  if (index === -1) return false;
  mockCourses.splice(index, 1);
  return true;
}

/**
 * Get lessons for a course
 */
export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  return mockLessons.filter((l) => l.courseId === courseId);
}

/**
 * Create lesson
 */
export async function createLesson(
  courseId: string,
  input: Omit<Lesson, "id" | "courseId" | "createdAt" | "updatedAt" | "createdBy">,
  userId: string
): Promise<Lesson> {
  const lesson: Lesson = {
    ...input,
    id: `lesson-${Date.now()}`,
    courseId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId,
  };
  mockLessons.push(lesson);

  // Add lesson to course
  const course = mockCourses.find((c) => c.id === courseId);
  if (course) {
    course.lessons.push(lesson.id);
  }

  return lesson;
}

/**
 * Delete lesson
 */
export async function deleteLesson(id: string): Promise<boolean> {
  const index = mockLessons.findIndex((l) => l.id === id);
  if (index === -1) return false;

  const lesson = mockLessons[index];
  mockLessons.splice(index, 1);

  // Remove from course
  const course = mockCourses.find((c) => c.id === lesson.courseId);
  if (course) {
    course.lessons = course.lessons.filter((lid) => lid !== id);
  }

  return true;
}
