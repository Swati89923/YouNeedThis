import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/endpoints";
import { errorMessage } from "../api/client";
import type { Feedback, Project } from "../api/types";
import { useSession } from "../auth/AuthContext";
import FeedbackCard from "../components/FeedbackCard";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, Meter, PageHeader, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { formatMoney, safeHttpsUrl } from "../lib/format";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const session = useSession();
  const { data, loading, error, reload, setData } = useAsync(
    () => api.project(projectId),
    [projectId],
  );

  if (!Number.isInteger(projectId)) return <ErrorState message="Invalid project link." />;
  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? "Not found"} onRetry={reload} />;

  const link = safeHttpsUrl(data.projectLink);

  return (
    <>
      <p className="crumb">
        <Link to={session.role === "DEVELOPER" ? "/projects" : "/browse"}>
          ← {session.role === "DEVELOPER" ? "My projects" : "Browse projects"}
        </Link>
      </p>
      <PageHeader
        title={data.projectName}
        subtitle={`by ${data.developerName}`}
        actions={
          link && (
            <a className="btn btn-secondary" href={link} target="_blank" rel="noopener noreferrer">
              Open project ↗
            </a>
          )
        }
      />

      <section className="card detail">
        <p className="pre">{data.description}</p>
        <dl className="facts">
          <div>
            <dt>Pay per review</dt>
            <dd>{formatMoney(data.payPerReview)}</dd>
          </div>
          <div>
            <dt>Open slots</dt>
            <dd>{data.reviewersNeeded}</dd>
          </div>
          {data.funded && (
            <div>
              <dt>Escrow left</dt>
              <dd>
                {formatMoney(data.escrowRemaining)} of {formatMoney(data.escrowTotal)}
              </dd>
            </div>
          )}
        </dl>
        {data.funded && <Meter value={data.escrowRemaining} max={data.escrowTotal} />}
      </section>

      {session.role === "DEVELOPER" ? (
        <OwnerView project={data} onProject={setData} />
      ) : (
        <ReviewerView project={data} onProject={setData} />
      )}
    </>
  );
}

// ---------------- developer ----------------

function OwnerView({
  project,
  onProject,
}: {
  project: Project;
  onProject: (p: Project) => void;
}) {
  const toast = useToast();
  const [funding, setFunding] = useState(false);
  const feedback = useAsync(() => api.projectFeedback(project.id), [project.id]);

  async function fund() {
    setFunding(true);
    try {
      const updated = await api.fundProject(project.id);
      onProject(updated);
      toast.success(`${formatMoney(updated.escrowTotal)} is now held in escrow.`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setFunding(false);
    }
  }

  function replace(updated: Feedback) {
    feedback.setData((feedback.data ?? []).map((f) => (f.id === updated.id ? updated : f)));
    api.project(project.id).then(onProject).catch(() => undefined);
  }

  return (
    <>
      {!project.funded && (
        <div className="card callout">
          <div>
            <strong>This project is not funded yet</strong>
            <p className="muted">
              Reviewers cannot see it until you put{" "}
              {formatMoney(project.reviewersNeeded * project.payPerReview)} in escrow.
            </p>
          </div>
          <button className="btn btn-primary" disabled={funding} onClick={fund}>
            {funding ? "Funding…" : "Fund escrow"}
          </button>
        </div>
      )}

      <h2 className="section-title">Feedback</h2>
      {feedback.loading && !feedback.data && <Spinner />}
      {feedback.error && <ErrorState message={feedback.error} onRetry={feedback.reload} />}
      {feedback.data?.length === 0 && (
        <EmptyState title="No feedback yet">
          {project.funded
            ? "Reviewers will show up here once they submit."
            : "Fund the project so reviewers can take it."}
        </EmptyState>
      )}
      <div className="stack">
        {feedback.data?.map((f) => (
          <FeedbackCard
            key={f.id}
            feedback={f}
            viewer="owner"
            showProject={false}
            onChanged={replace}
          />
        ))}
      </div>
    </>
  );
}

// ---------------- reviewer ----------------

function ReviewerView({
  project,
  onProject,
}: {
  project: Project;
  onProject: (p: Project) => void;
}) {
  const toast = useToast();
  const [taking, setTaking] = useState(false);

  async function take() {
    setTaking(true);
    try {
      onProject(await api.takeProject(project.id));
      toast.success("Project taken. Write your feedback below.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setTaking(false);
    }
  }

  if (!project.assignedToMe) {
    const closed = project.reviewersNeeded <= 0 || !project.funded;
    return (
      <div className="card callout">
        <div>
          <strong>
            {closed ? "This project is not taking reviewers" : "Take this project"}
          </strong>
          <p className="muted">
            {closed
              ? "All slots are filled or it is not funded."
              : `You earn ${formatMoney(project.payPerReview)} when the developer approves your feedback.`}
          </p>
        </div>
        <button className="btn btn-primary" disabled={closed || taking} onClick={take}>
          {taking ? "Taking…" : "Take project"}
        </button>
      </div>
    );
  }

  if (project.feedbackSubmittedByMe) return <MySubmission project={project} />;
  return <FeedbackForm project={project} onSent={() => onProject({ ...project, feedbackSubmittedByMe: true })} />;
}

function MySubmission({ project }: { project: Project }) {
  const mine = useAsync(() => api.myFeedback(), [project.id]);
  const feedback = mine.data?.find((f) => f.projectId === project.id);

  return (
    <>
      <h2 className="section-title">Your feedback</h2>
      {mine.loading && !mine.data && <Spinner />}
      {mine.error && <ErrorState message={mine.error} onRetry={mine.reload} />}
      {feedback && (
        <FeedbackCard feedback={feedback} viewer="reviewer" onChanged={() => mine.reload()} />
      )}
    </>
  );
}

function FeedbackForm({ project, onSent }: { project: Project; onSent: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) return setError("Pick a rating from 1 to 5.");
    if (comment.trim().length < 20)
      return setError("Write at least 20 characters so the developer can act on it.");
    setBusy(true);
    try {
      await api.submitFeedback(project.id, rating, comment.trim());
      toast.success("Feedback submitted. You will be paid once it is approved.");
      onSent();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <>
      <h2 className="section-title">Your feedback</h2>
      <form className="card form-card" onSubmit={submit} noValidate>
        <fieldset className="rating-pick">
          <legend>Overall rating</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={n <= rating ? "star-opt on" : "star-opt"}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
              />
              <span aria-hidden="true">★</span>
              <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
            </label>
          ))}
        </fieldset>

        <div className="field">
          <label htmlFor="fb-comment">What did you find?</label>
          <textarea
            id="fb-comment"
            rows={7}
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked, what was confusing, what broke, and how to fix it."
          />
          <small className="muted">{comment.length}/2000</small>
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Submitting…" : "Submit feedback"}
          </button>
        </div>
      </form>
    </>
  );
}
