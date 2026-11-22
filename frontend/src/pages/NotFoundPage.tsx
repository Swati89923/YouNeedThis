import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui";

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      action={
        <Link className="btn btn-primary" to="/">
          Back to dashboard
        </Link>
      }
    >
      That page does not exist, or you cannot open it with this account.
    </EmptyState>
  );
}
