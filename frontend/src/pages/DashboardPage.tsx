import { Link } from "react-router-dom";
import { api } from "../api/endpoints";
import { useSession } from "../auth/AuthContext";
import { ErrorState, PageHeader, Spinner, StatCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { formatMoney } from "../lib/format";

export default function DashboardPage() {
  const session = useSession();
  const firstName = session.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Hi, ${firstName}`}
        subtitle={
          session.role === "DEVELOPER"
            ? "Here is how your projects are doing."
            : "Here is your reviewing activity."
        }
      />
      {session.role === "DEVELOPER" ? <DeveloperDashboard /> : <ReviewerDashboard />}
    </>
  );
}

function DeveloperDashboard() {
  const { data, loading, error, reload } = useAsync(() => api.developerStats());

  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;

  return (
    <>
      <div className="stats">
        <StatCard label="Projects" value={data.totalProjects} />
        <StatCard label="Feedback received" value={data.totalFeedbacks} />
        <StatCard
          label="Waiting for you"
          value={data.pendingReview}
          tone={data.pendingReview > 0 ? "warn" : "default"}
          hint={data.pendingReview > 0 ? "Review to pay your reviewers" : "All caught up"}
        />
        <StatCard
          label="Average rating"
          value={data.totalFeedbacks ? data.avgRating.toFixed(1) : "–"}
        />
        <StatCard label="Paid out" value={formatMoney(data.totalSpent)} />
        <StatCard label="Left in escrow" value={formatMoney(data.escrowRemaining)} />
      </div>

      <div className="cta-row">
        <Link className="btn btn-primary" to="/projects/new">
          New project
        </Link>
        <Link className="btn btn-secondary" to="/inbox">
          Open feedback inbox
          {data.pendingReview > 0 ? ` (${data.pendingReview})` : ""}
        </Link>
      </div>
    </>
  );
}

function ReviewerDashboard() {
  const { data, loading, error, reload } = useAsync(() => api.reviewerStats());

  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;

  return (
    <>
      <div className="stats">
        <StatCard label="Wallet" value={formatMoney(data.walletBalance)} tone="good" />
        <StatCard label="Total earned" value={formatMoney(data.totalEarnings)} />
        <StatCard
          label="To write"
          value={data.activeProjects}
          tone={data.activeProjects > 0 ? "warn" : "default"}
          hint={data.activeProjects > 0 ? "Projects you took" : undefined}
        />
        <StatCard label="Submitted" value={data.totalFeedbacks} />
        <StatCard label="Approved" value={data.approvedFeedbacks} />
        <StatCard label="Reputation" value={data.reviewerScore} hint="10 per approved review" />
      </div>

      <div className="cta-row">
        <Link className="btn btn-primary" to="/browse">
          Find a project
        </Link>
        <Link className="btn btn-secondary" to="/work">
          Continue my work
        </Link>
      </div>
    </>
  );
}
