import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

const BillingCancel = () => (
  <div className="mx-auto max-w-lg px-4 py-20 text-center">
    <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
    <h1 className="mt-4 text-2xl font-semibold">Checkout canceled</h1>
    <p className="mt-2 text-muted-foreground">
      No charges were made. You can try again anytime.
    </p>
    <Link
      to="/pricing-plans"
      className="mt-6 inline-block rounded-md bg-primary px-6 py-2 text-primary-foreground"
    >
      Back to plans
    </Link>
  </div>
);

export default BillingCancel;
