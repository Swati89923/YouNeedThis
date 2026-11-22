import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/endpoints";
import { errorMessage } from "../api/client";
import type { Project } from "../api/types";
import ProjectCard from "../components/ProjectCard";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { formatMoney } from "../lib/format";

export default function MyProjectsPage() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => api.myProjects());
  const [funding, setFunding] = useState<number | null>(null);

  async function fund(project: Project) {
    setFunding(project.id);
    try {
      const updated = await api.fundProject(project.id);
      setData((data ?? []).map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`${formatMoney(updated.escrowTotal)} is now held in escrow.`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setFunding(null);
    }
  }

  return (
    <>
      <PageHeader
        title="My projects"
        subtitle="Fund a project to open it to reviewers."
        actions={
          <Link className="btn btn-primary" to="/projects/new">
            New project
          </Link>
        }
      />

      {loading && !data && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.length === 0 && (
        <EmptyState
          title="No projects yet"
          action={
            <Link className="btn btn-primary" to="/projects/new">
              Create your first project
            </Link>
          }
        >
          Describe what you want reviewed and set what you pay per review.
        </EmptyState>
      )}

      <div className="grid">
        {data?.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            footer={
              p.funded ? (
                <div className="foot-row">
                  <span className="badge badge-approved">Funded</span>
                  <span className="muted">
                    {p.feedbackCount} feedback
                    {p.pendingFeedbackCount > 0 && ` · ${p.pendingFeedbackCount} to review`}
                  </span>
                  <Link className="btn btn-secondary" to={`/projects/${p.id}`}>
                    Open
                  </Link>
                </div>
              ) : (
                <div className="foot-row">
                  <span className="badge badge-pending">Not funded</span>
                  <button
                    className="btn btn-primary"
                    disabled={funding === p.id}
                    onClick={() => fund(p)}
                  >
                    {funding === p.id
                      ? "Funding…"
                      : `Fund ${formatMoney(p.reviewersNeeded * p.payPerReview)}`}
                  </button>
                </div>
              )
            }
          />
        ))}
      </div>
    </>
  );
}
