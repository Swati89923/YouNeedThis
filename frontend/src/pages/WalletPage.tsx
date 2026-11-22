import { useState } from "react";
import { api } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { useToast } from "../components/Toast";
import { ErrorState, PageHeader, Spinner, StatCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { formatMoney } from "../lib/format";

export default function WalletPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.reviewerStats());
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 1) {
      return setFormError("Enter a whole amount of at least 1.");
    }
    if (data && value > data.walletBalance) {
      return setFormError("That is more than your balance.");
    }
    setBusy(true);
    try {
      await api.withdraw(value);
      toast.success(`Withdrawal of ${formatMoney(value)} requested.`);
      setAmount("");
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

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

          <form className="card form-card" style={{ marginTop: 20 }} onSubmit={withdraw} noValidate>
            <h2 className="section-title" style={{ marginTop: 0 }}>Withdraw</h2>
            <div className="field">
              <label htmlFor="w-amount">Amount (₹)</label>
              <input
                id="w-amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={!!formError}
              />
              {formError && <small className="field-error" role="alert">{formError}</small>}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setAmount(String(data.walletBalance))}
                disabled={data.walletBalance < 1}
              >
                Withdraw all
              </button>
              <button className="btn btn-primary" disabled={busy || data.walletBalance < 1}>
                {busy ? "Requesting…" : "Withdraw"}
              </button>
            </div>
          </form>
          <p className="muted note">
            Payouts are simulated for now. No money leaves the platform until a payment provider is connected.
          </p>
        </>
      )}
    </>
  );
}
