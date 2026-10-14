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
