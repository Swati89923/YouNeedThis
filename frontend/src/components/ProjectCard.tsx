import { Link } from "react-router-dom";
import type { Project } from "../api/types";
import { formatMoney, safeHttpsUrl } from "../lib/format";

function hostOf(url: string | null): string | null {
  const safe = safeHttpsUrl(url);
  if (!safe) return null;
  try {
    return new URL(safe).host;
  } catch {
    return null;
  }
}

export default function ProjectCard({
  project,
  footer,
}: {
  project: Project;
  footer?: React.ReactNode;
}) {
  const host = hostOf(project.projectLink);

  return (
    <article className="card project">
      <div className="project-top">
        <h3>
          <Link to={`/projects/${project.id}`}>{project.projectName}</Link>
        </h3>
        <span className="pay">{formatMoney(project.payPerReview)}</span>
      </div>
      <p className="clamp">{project.description}</p>
      <div className="chips">
        {host && <span className="chip">{host}</span>}
        <span className="chip">
          {project.reviewersNeeded} slot{project.reviewersNeeded === 1 ? "" : "s"} open
        </span>
        <span className="chip muted-chip">by {project.developerName}</span>
      </div>
      {footer && <div className="project-foot">{footer}</div>}
    </article>
  );
}
