import { useState } from "react";
import { api } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { timeAgo } from "../lib/format";

export default function NotificationsPage() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => api.notifications());
  const [busy, setBusy] = useState(false);

  const unread = data?.filter((n) => !n.seen).length ?? 0;

  async function markAll() {
    setBusy(true);
    try {
      await api.markAllNotificationsRead();
      setData((data ?? []).map((n) => ({ ...n, seen: true })));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          unread > 0 && (
            <button className="btn btn-secondary" disabled={busy} onClick={markAll}>
              Mark all as read
            </button>
          )
        }
      />
      {loading && !data && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.length === 0 && (
        <EmptyState title="Nothing yet">Updates about your projects and payments show up here.</EmptyState>
      )}
      <ul className="notes">
        {data?.map((n) => (
          <li key={n.id} className={n.seen ? "note-row" : "note-row unread"}>
            <span className="dot" aria-hidden="true" />
            <div>
              <p>{n.message}</p>
              <span className="muted">{timeAgo(n.createdAt)}</span>
            </div>
            {!n.seen && <span className="sr-only">Unread</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
