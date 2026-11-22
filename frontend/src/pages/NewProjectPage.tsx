import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { useToast } from "../components/Toast";
import { PageHeader } from "../components/ui";
import { formatMoney } from "../lib/format";

interface Errors {
  projectName?: string;
  description?: string;
  projectLink?: string;
  reviewersNeeded?: string;
  payPerReview?: string;
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [projectName, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectLink, setLink] = useState("");
  const [reviewers, setReviewers] = useState("3");
  const [pay, setPay] = useState("100");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const total = (Number(reviewers) || 0) * (Number(pay) || 0);

  function validate(): Errors {
    const e: Errors = {};
    if (!projectName.trim()) e.projectName = "Give the project a name.";
    else if (projectName.length > 120) e.projectName = "Keep the name under 120 characters.";
    if (!description.trim()) e.description = "Say what reviewers should look at.";
    if (projectLink.trim() && !/^https:\/\//i.test(projectLink.trim()))
      e.projectLink = "Link must start with https://";
    if (!Number.isInteger(Number(reviewers)) || Number(reviewers) < 1 || Number(reviewers) > 100)
      e.reviewersNeeded = "Enter a whole number from 1 to 100.";
    if (!Number.isInteger(Number(pay)) || Number(pay) < 1)
      e.payPerReview = "Enter a whole amount of at least 1.";
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const project = await api.createProject({
        projectName: projectName.trim(),
        description: description.trim(),
        projectLink: projectLink.trim(),
        reviewersNeeded: Number(reviewers),
        payPerReview: Number(pay),
      });
      toast.success("Project created. Fund it to open it to reviewers.");
      navigate(`/projects/${project.id}`, { replace: true });
    } catch (e) {
      setServerError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New project"
        subtitle="Tell reviewers what to test and what you will pay."
      />

      <form className="card form-card" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="p-name">Project name</label>
          <input
            id="p-name"
            value={projectName}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.projectName}
          />
          {errors.projectName && <small className="field-error">{errors.projectName}</small>}
        </div>

        <div className="field">
          <label htmlFor="p-desc">What should reviewers look at?</label>
          <textarea
            id="p-desc"
            rows={5}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errors.description}
          />
          <small className="muted">{description.length}/2000</small>
          {errors.description && <small className="field-error">{errors.description}</small>}
        </div>

        <div className="field">
          <label htmlFor="p-link">Link (optional)</label>
          <input
            id="p-link"
            type="url"
            placeholder="https://"
            value={projectLink}
            onChange={(e) => setLink(e.target.value)}
            aria-invalid={!!errors.projectLink}
          />
          <small className="muted">Play Store listing or an HTTPS website.</small>
          {errors.projectLink && <small className="field-error">{errors.projectLink}</small>}
        </div>

        <div className="two-col">
          <div className="field">
            <label htmlFor="p-count">Reviewers needed</label>
            <input
              id="p-count"
              inputMode="numeric"
              value={reviewers}
              onChange={(e) => setReviewers(e.target.value)}
              aria-invalid={!!errors.reviewersNeeded}
            />
            {errors.reviewersNeeded && <small className="field-error">{errors.reviewersNeeded}</small>}
          </div>
          <div className="field">
            <label htmlFor="p-pay">Pay per review (₹)</label>
            <input
              id="p-pay"
              inputMode="numeric"
              value={pay}
              onChange={(e) => setPay(e.target.value)}
              aria-invalid={!!errors.payPerReview}
            />
            {errors.payPerReview && <small className="field-error">{errors.payPerReview}</small>}
          </div>
        </div>

        <p className="summary">
          Escrow to fund: <strong>{formatMoney(total)}</strong>
          <span className="muted"> ({reviewers || 0} × {formatMoney(Number(pay) || 0)}). You release it one review at a time.</span>
        </p>

        {serverError && (
          <p className="field-error" role="alert">
            {serverError}
          </p>
        )}

        <div className="form-actions">
          <Link className="btn btn-ghost" to="/projects">
            Cancel
          </Link>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </>
  );
}
