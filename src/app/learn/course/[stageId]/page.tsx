import { notFound } from 'next/navigation';
import { SYLLABUS } from '@/content/syllabus';
import { CourseDetail } from '@/components/learn/CourseDetail';

export function generateStaticParams() {
  return SYLLABUS.map((s) => ({ stageId: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params;
  const stage = SYLLABUS.find((s) => s.id === stageId);
  if (!stage) return {};
  return {
    title: `${stage.courseTitle} — Market Academy`,
    description: stage.why,
  };
}

export default async function CoursePage({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params;
  const stage = SYLLABUS.find((s) => s.id === stageId);
  if (!stage) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-4xl lg:py-20">
      <CourseDetail stage={stage} />
    </main>
  );
}
