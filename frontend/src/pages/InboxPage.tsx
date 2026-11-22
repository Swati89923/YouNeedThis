import { useState } from "react";
import { api } from "../api/endpoints";
import type { Feedback } from "../api/types";
import FeedbackCard from "../components/FeedbackCard";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

type Filter = "PENDING" | "ALL";

export default function InboxPage() {
  const { data, loading, error, reload, setData } = useAsync(() => api.receivedFeedback());
  const [filter, setFilter] = useState<Filter>("PENDING");

  const pending = data?.filter((f) => f.status === "PENDING").length ?? 0;
  const shown = data?.filter((f) => filter === "ALL" || f.status === "PENDING") ?? [];

  function replace(updated: Feedback) {
    setData((data ?? []).map((f) => (f.id === updated.id ? updated : f)));
  }

  return (
    <>
      <PageHeader
        title="Feedback inbox"
        subtitle="Approve good feedback to pay the reviewer from escrow."
      />

      <div className="tabs" role="tablist" aria-label="Filter feedback">
        <button
          role="tab"
          aria-selected={filter === "PENDING"}
          className={filter === "PENDING" ? "tab on" : "tab"}
          onClick={() => setFilter("PENDING")}
        >
          To review{pending > 0 ? ` (${pending})` : ""}
        </button>
        <button
          role="tab"
          aria-selected={filter === "ALL"}
          className={filter === "ALL" ? "tab on" : "tab"}
          onClick={() => setFilter("ALL")}
        >
          All
        </button>
      </div>

      {loading && !data && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && shown.length === 0 && (
        <EmptyState title={filter === "PENDING" ? "Nothing to review" : "No feedback yet"}>
          {filter === "PENDING"
            ? "New feedback from reviewers will appear here."
            : "Feedback shows up once reviewers submit it."}
        </EmptyState>
      )}
      <div className="stack">
        {shown.map((f) => (
          <FeedbackCard key={f.id} feedback={f} viewer="owner" onChanged={replace} />
        ))}
      </div>
    </>
  );
}
