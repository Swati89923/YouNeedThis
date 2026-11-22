import { api } from "../api/endpoints";
import { ErrorState, PageHeader, Spinner, StatCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { formatMoney } from "../lib/format";

export default function WalletPage() {
  const { data, loading, error, reload } = useAsync(() => api.reviewerStats());

  return (
    <>
      <PageHeader title="Wallet" subtitle="Earnings from approved feedback." />
      {loading && !data && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <div className="stats">
            <StatCard label="Balance" value={formatMoney(data.walletBalance)} tone="good" />
            <StatCard label="Approved reviews" value={data.approvedFeedbacks} />
            <StatCard label="Waiting for approval" value={data.pendingFeedbacks} />
          </div>
          <p className="muted note">
            Money lands here the moment a developer approves your feedback.
            Withdrawals are not available yet.
          </p>
        </>
      )}
    </>
  );
}
