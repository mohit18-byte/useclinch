import { redirect } from 'next/navigation';

// Redirect to the analytics page — this is the primary proposal view.
// The editor is accessed via the "Edit" button on the analytics page.
export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/proposals/${id}/analytics`);
}
