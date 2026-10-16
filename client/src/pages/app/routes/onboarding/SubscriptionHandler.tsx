import { useState } from "react";
import {
  Check,
  Building2,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";

// shadcn/ui components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateCheckoutSession } from "../../hooks/organization/useOnboarding";

// ---------------------------------------------------------------------------
// Type Definitions & Feature Display Mapping
// ---------------------------------------------------------------------------

export interface Plan {
  key: "starter" | "professional" | "business";
  name: string;
  description: string;
  stripe_price_id: string;
  price_amount: number; // in cents (e.g. 1900 = $19)
  price_currency: string;
  max_properties: number | null; // null represents unlimited
  max_team_members: number | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  isPopular?: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  direct_booking: "Direct Booking Engine",
  custom_domain: "Custom Domain Connection",
  pms_integration: "Two-way PMS Integration",
  analytics: "Advanced Analytics & Reporting",
  remove_branding: "White-label (No Branding)",
  priority_support: "24/7 Dedicated Priority Support",
};

// ---------------------------------------------------------------------------
// Static Plans Dataset (Matching SQL Data)
// ---------------------------------------------------------------------------

const PLANS_DATA: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    description: "Essential tools for small property management businesses",
    stripe_price_id: "price_REPLACE_WITH_STARTER_PRICE_ID",
    price_amount: 1900,
    price_currency: "usd",
    max_properties: 5,
    max_team_members: 3,
    features: ["direct_booking"],
    is_active: true,
    sort_order: 1,
    isPopular: false,
  },
  {
    key: "professional",
    name: "Professional",
    description: "Advanced tools for growing property management businesses",
    stripe_price_id: "price_REPLACE_WITH_PRO_PRICE_ID",
    price_amount: 4900,
    price_currency: "usd",
    max_properties: 25,
    max_team_members: 10,
    features: [
      "custom_domain",
      "pms_integration",
      "direct_booking",
      "analytics",
    ],
    is_active: true,
    sort_order: 2,
    isPopular: true,
  },
  {
    key: "business",
    name: "Business",
    description:
      "Enterprise-grade infrastructure for large property portfolios",
    stripe_price_id: "price_REPLACE_WITH_BUSINESS_PRICE_ID",
    price_amount: 9900,
    price_currency: "usd",
    max_properties: null,
    max_team_members: null,
    features: [
      "custom_domain",
      "pms_integration",
      "direct_booking",
      "analytics",
      "remove_branding",
      "priority_support",
    ],
    is_active: true,
    sort_order: 3,
    isPopular: false,
  },
];

// ---------------------------------------------------------------------------
// Component Implementation
// ---------------------------------------------------------------------------

export default function SubscriptionHandler() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">(
    "monthly"
  );
  const [selectedPlanKey, setSelectedPlanKey] =
    useState<string>("professional");

  const { createCheckoutSession, isLoading } = useCreateCheckoutSession();

  const formatPrice = (cents: number, currency: string) => {
    const multiplier = billingCycle === "annually" ? 0.8 : 1.0;
    const computedCents = Math.round(cents * multiplier);

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(computedCents / 100);
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlanKey(plan.key);
    createCheckoutSession({
      plan: plan.key,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge
            variant="outline"
            className="border-slate-800 bg-slate-900/80 text-slate-300 font-mono text-xs uppercase tracking-widest px-3 py-1"
          >
            Billing & Organization Subscriptions
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Predictable tiers for every portfolio size
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Scale seamlessly across your rental units and team members. Change
            or cancel your plan at any time.
          </p>

          {/* Billing Interval Switcher */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  billingCycle === "monthly"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annually")}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  billingCycle === "annually"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Annual billing
                <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 rounded px-1.5 py-0.2">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PLANS_DATA.filter((p) => p.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((plan) => {
              const isSelected = selectedPlanKey === plan.key;

              return (
                <Card
                  key={plan.key}
                  className={`relative flex flex-col justify-between rounded-xl bg-slate-900/60 backdrop-blur border transition-all duration-200 ${
                    plan.isPopular
                      ? "border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-xl shadow-indigo-950/20"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Top Popular Ribbon */}
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[11px] font-bold tracking-wider uppercase px-3 py-0.5 rounded-full shadow-sm">
                        <Sparkles className="w-3 h-3" /> Most Recommended
                      </span>
                    </div>
                  )}

                  <div>
                    <CardHeader className="pb-6 border-b border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-white tracking-tight">
                          {plan.name}
                        </CardTitle>
                        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                          Tier 0{plan.sort_order}
                        </span>
                      </div>
                      <CardDescription className="text-slate-400 text-xs min-h-[32px] mt-1.5 leading-snug">
                        {plan.description}
                      </CardDescription>

                      {/* Pricing block */}
                      <div className="mt-5 flex items-baseline gap-1.5">
                        <span className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-mono">
                          {formatPrice(plan.price_amount, plan.price_currency)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          / month
                        </span>
                      </div>
                      {billingCycle === "annually" && (
                        <p className="text-[11px] font-mono text-emerald-400 mt-1">
                          Billed annually ($
                          {(plan.price_amount * 12 * 0.8) / 100} / yr)
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6">
                      {/* Operational Quotas Matrix */}
                      <div className="rounded-lg bg-slate-950/50 border border-slate-800/80 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-slate-400">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />{" "}
                            Max Properties
                          </span>
                          <span className="font-mono font-semibold text-slate-200">
                            {plan.max_properties !== null
                              ? `${plan.max_properties} Units`
                              : "Unlimited"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-slate-400">
                            <Users className="w-3.5 h-3.5 text-slate-500" />{" "}
                            Team Seats
                          </span>
                          <span className="font-mono font-semibold text-slate-200">
                            {plan.max_team_members !== null
                              ? `${plan.max_team_members} Seats`
                              : "Unlimited"}
                          </span>
                        </div>
                      </div>

                      {/* Included Feature List */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Features & Integrations
                        </span>
                        <ul className="space-y-2.5">
                          {plan.features.map((featureKey) => (
                            <li
                              key={featureKey}
                              className="flex items-start gap-2.5 text-xs text-slate-300"
                            >
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-tight">
                                {FEATURE_LABELS[featureKey] ?? featureKey}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-4 pb-6 border-t border-slate-800/60 mt-6">
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isLoading}
                      className={`w-full font-semibold text-xs tracking-wide h-10 transition-all ${
                        plan.isPopular
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/40"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
                      }`}
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5">
                          {isSelected
                            ? "Select & Continue"
                            : `Choose ${plan.name}`}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
        </div>

        {/* Feature Matrix / Guarantee Footer */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  Bank-Grade Encryption
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  PCI-DSS Level 1 certified checkout handled securely through
                  Stripe.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  Instant Provisioning
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Capacity limits unlock automatically within your organization
                  immediately after confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  Prorated Adjustments
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Upgrading or downgrading dynamically recalculates unused days
                  at checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
