import { Link } from "react-router-dom";
import { api } from "../api/endpoints";
import ProjectCard from "../components/ProjectCard";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

export default function WorkPage() {
  const { data, loading, error, reload } = useAsync(() => api.assignedProjects());

  const todo = data?.filter((p) => !p.feedbackSubmittedByMe) ?? [];
  const done = data?.filter((p) => p.feedbackSubmittedByMe) ?? [];

  return (
    <>
      <PageHeader title="My work" subtitle="Projects you took." />

      {loading && !data && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <EmptyState
          title="You have not taken a project yet"
          action={
            <Link className="btn btn-primary" to="/browse">
              Browse projects
            </Link>
          }
        >
          Pick one that matches what you like to test.
        </EmptyState>
      )}

      {todo.length > 0 && (
        <>
          <h2 className="section-title">To write ({todo.length})</h2>
          <div className="grid">
            {todo.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                footer={
                  <div className="foot-row">
                    <span className="badge badge-pending">Feedback due</span>
                    <Link className="btn btn-primary" to={`/projects/${p.id}`}>
                      Write feedback
                    </Link>
                  </div>
                }
              />
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <h2 className="section-title">Submitted ({done.length})</h2>
          <div className="grid">
            {done.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                footer={
                  <div className="foot-row">
                    <span className="badge badge-approved">Submitted</span>
                    <Link className="btn btn-secondary" to={`/projects/${p.id}`}>
                      View
                    </Link>
                  </div>
                }
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
