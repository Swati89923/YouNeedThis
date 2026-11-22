import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/endpoints";
import { errorMessage } from "../api/client";
import type { Feedback } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { formatMoney, timeAgo } from "../lib/format";
import { useToast } from "./Toast";
import { Avatar, Spinner, Stars, StatusBadge } from "./ui";

interface Props {
  feedback: Feedback;
  /** "owner" can approve or reject. "reviewer" sees their own submission. */
  viewer: "owner" | "reviewer";
  showProject?: boolean;
  onChanged: (updated: Feedback) => void;
}

export default function FeedbackCard({
  feedback,
  viewer,
  showProject = true,
  onChanged,
}: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [open, setOpen] = useState(false);

  async function decide(action: "approve" | "reject") {
    setBusy(action);
    try {
      const updated =
        action === "approve"
          ? await api.approveFeedback(feedback.id)
          : await api.rejectFeedback(feedback.id);
      onChanged(updated);
      toast.success(
        action === "approve"
          ? `Approved. ${formatMoney(feedback.payPerReview)} paid to ${feedback.reviewerName}.`
          : "Feedback rejected.",
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const canDecide = viewer === "owner" && feedback.status === "PENDING";

  return (
    <article className="card feedback">
      <div className="feedback-head">
        <Avatar name={viewer === "owner" ? feedback.reviewerName : feedback.projectName} />
        <div className="feedback-who">
          <strong>
            {viewer === "owner" ? feedback.reviewerName : feedback.projectName}
          </strong>
          <span className="muted">
            {showProject && viewer === "owner" && (
              <>
                on{" "}
                <Link to={`/projects/${feedback.projectId}`}>
                  {feedback.projectName}
                </Link>{" "}
                ·{" "}
              </>
            )}
            {timeAgo(feedback.createdAt)}
          </span>
        </div>
        <StatusBadge status={feedback.status} />
      </div>

      <Stars value={feedback.rating} />
      <p className="feedback-text">{feedback.comment}</p>

      <div className="feedback-actions">
        {canDecide && (
          <>
            <button
              className="btn btn-primary"
              disabled={busy !== null}
              onClick={() => decide("approve")}
            >
              {busy === "approve"
                ? "Approving…"
                : `Approve and pay ${formatMoney(feedback.payPerReview)}`}
            </button>
            <button
              className="btn btn-danger-ghost"
              disabled={busy !== null}
              onClick={() => decide("reject")}
            >
              {busy === "reject" ? "Rejecting…" : "Reject"}
            </button>
          </>
        )}
        <button
          className="btn btn-ghost"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide conversation" : "Conversation"}
        </button>
      </div>

      {open && <Conversation feedbackId={feedback.id} />}
    </article>
  );
}

function Conversation({ feedbackId }: { feedbackId: number }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(
    () => api.comments(feedbackId),
    [feedbackId],
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.addComment(feedbackId, text.trim());
      setText("");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="conversation">
      {loading && !data && <Spinner />}
      {error && <p className="field-error">{error}</p>}
      {data && data.length === 0 && (
        <p className="muted">
          No messages yet. Ask a question or clarify something.
        </p>
      )}
      <ul className="thread">
        {data?.map((c) => (
          <li key={c.id}>
            <Avatar name={c.authorName} small />
            <div>
              <strong>{c.authorName}</strong>{" "}
              <span className="muted">
                {c.authorRole === "DEVELOPER" ? "Developer" : "Reviewer"} ·{" "}
                {timeAgo(c.createdAt)}
              </span>
              <p>{c.message}</p>
            </div>
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={send}>
        <label className="sr-only" htmlFor={`msg-${feedbackId}`}>
          Message
        </label>
        <input
          id={`msg-${feedbackId}`}
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
        />
        <button className="btn btn-secondary" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
