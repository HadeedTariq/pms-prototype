type User = {
  id: string;
  user_name?: string;
  email: string;
  role: string;
  gender: "male" | "female" | "other";
  country_code: string;
};

type ErrResponse = {
  response: {
    data: {
      message: string;
      otpType?: string;
      code?: string;
    };
  };
};

type OnboardingData = {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string | null;
  type:
    | "other"
    | "hotel"
    | "villa"
    | "apartment"
    | "hostel"
    | "guest_house"
    | "bnb"
    | "resort";
  country: string;
  currency: string;
  timezone: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: "active" | "suspended" | "pending";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CreateCheckoutSessionInput = {
  plan: string;
};

type SubscriptionStatusResponse = {
  hasSubscription: boolean;
  isActive?: boolean;
  planKey: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  entitlements: string[];
  hasBillingAccount: boolean;
  plan?: {
    key: string;
    name: string;
    description: string | null;
    priceAmount: number;
    priceCurrency: string;
    maxProperties: number | null;
    maxTeamMembers: number | null;
    features: string[];
  } | null;
};
