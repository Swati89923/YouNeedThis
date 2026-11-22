import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/endpoints";
import ProjectCard from "../components/ProjectCard";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

type Sort = "newest" | "pay";

export default function BrowsePage() {
  const { data, loading, error, reload } = useAsync(() => api.availableProjects());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (data ?? []).filter(
      (p) =>
        !q ||
        p.projectName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
    return sort === "pay"
      ? [...list].sort((a, b) => b.payPerReview - a.payPerReview)
      : list;
  }, [data, query, sort]);

  return (
    <>
      <PageHeader
        title="Browse projects"
        subtitle="Funded projects that still need reviewers."
      />

      <div className="toolbar">
        <div className="field grow">
          <label className="sr-only" htmlFor="q">
            Search projects
          </label>
          <input
            id="q"
            type="search"
            placeholder="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="newest">Newest</option>
            <option value="pay">Highest pay</option>
          </select>
        </div>
      </div>

      {loading && !data && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && shown.length === 0 && (
        <EmptyState title={query ? "No projects match" : "No open projects right now"}>
          {query ? "Try a different search." : "Check back soon. New projects are added often."}
        </EmptyState>
      )}

      <div className="grid">
        {shown.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            footer={
              <div className="foot-row">
                {p.assignedToMe ? (
                  <span className="badge badge-approved">You took this</span>
                ) : (
                  <span className="muted">Earn per approved review</span>
                )}
                <Link className="btn btn-secondary" to={`/projects/${p.id}`}>
                  {p.assignedToMe ? "Continue" : "View"}
                </Link>
              </div>
            }
          />
        ))}
      </div>
    </>
  );
}
