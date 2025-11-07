// src/app/dashboard/reviewer/review/[id]/page.tsx
export default function Page({ params }: { params: { id: string } }) {
  return <h1>Review (ID: {params.id}) — Reviewer</h1>;
}
