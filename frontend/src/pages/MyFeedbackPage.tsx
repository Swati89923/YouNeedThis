import { api } from "../api/endpoints";
import FeedbackCard from "../components/FeedbackCard";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

export default function MyFeedbackPage() {
  const { data, loading, error, reload } = useAsync(() => api.myFeedback());

  return (
    <>
      <PageHeader
        title="My feedback"
        subtitle="Everything you submitted and whether it was paid."
      />
      {loading && !data && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.length === 0 && (
        <EmptyState title="No feedback submitted yet">
          Take a project and send your first review.
        </EmptyState>
      )}
      <div className="stack">
        {data?.map((f) => (
          <FeedbackCard key={f.id} feedback={f} viewer="reviewer" onChanged={() => reload()} />
        ))}
      </div>
    </>
  );
}
