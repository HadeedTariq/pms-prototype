import { useMemo } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ArrowRight,
  Sparkles,
  BedDouble,
  Home,
  Hotel,
  Palmtree,
  Users,
  Coffee,
  Waves,
  HelpCircle,
} from "lucide-react";
import { useCreateOrganization } from "../../hooks/organization/useOnboarding";
import { CreateOrganizationInput } from "../../validators/organization.validator";
import { cn } from "@/lib/utils";
import { COUNTRIES, CURRENCIES, TIMEZONES } from "@/data/data";

const ORGANIZATION_TYPES = [
  { value: "hotel", label: "Hotel", icon: Hotel },
  { value: "villa", label: "Villa", icon: Home },
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "hostel", label: "Hostel", icon: BedDouble },
  { value: "guest_house", label: "Guest House", icon: Coffee },
  { value: "bnb", label: "Bed & Breakfast", icon: Coffee },
  { value: "resort", label: "Resort", icon: Palmtree },
  { value: "other", label: "Other", icon: HelpCircle },
] as const;

/** Derive slug from title (mirrors backend expectation) */
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const HandleOnboarding = () => {
  const { form, mutations } = useCreateOrganization();
  const isSubmitting = mutations.isPending;

  // Map data → searchable options
  const countryOptions = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        value: c.code,
        label: c.name,
        hint: c.code,
        prefix: c.flag,
        keywords: c.dialCode,
      })),
    [],
  );

  const currencyOptions = useMemo(
    () =>
      CURRENCIES.map((c) => ({
        value: c.code,
        label: c.name,
        hint: c.code,
        prefix: c.symbol,
      })),
    [],
  );

  const timezoneOptions = useMemo(
    () =>
      TIMEZONES.map((t) => ({
        value: t.value,
        label: `${t.label}`,
        hint: t.offset,
        keywords: t.value,
      })),
    [],
  );

  const onSubmit = (data: CreateOrganizationInput) => {
    mutations.mutate(data);
  };

  // Watch title → auto-fill slug suggestion if slug is empty
  const title = form.watch("title");
  const slug = form.watch("slug");

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          Step 1 of 1 · Organization Setup
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Create your organization
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Set up your property profile. This powers your bookings, rates, and
          guest communications — you can refine everything later.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ─── Section: Identity ───────────────────────────────── */}
          <SectionCard
            icon={<Building2 className="h-4 w-4" />}
            title="Organization identity"
            description="The name and description guests will see."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization title <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Grand Vista Resort"
                        autoComplete="organization"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          title ? slugify(title) : "grand-vista-resort"
                        }
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Leave blank to auto-generate from title.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short description guests will read — location highlights, vibe, amenities..."
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>

          {/* ─── Section: Type ───────────────────────────────────── */}
          <SectionCard
            icon={<Hotel className="h-4 w-4" />}
            title="Property type"
            description="Pick the category that best matches your business."
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {ORGANIZATION_TYPES.map((t) => {
                        const Icon = t.icon;
                        const active = field.value === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => field.onChange(t.value)}
                            className={cn(
                              "group flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
                              "hover:border-primary/50 hover:bg-accent/50",
                              active
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-card",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span
                              className={cn(
                                "text-sm font-medium",
                                active && "text-primary",
                              )}
                            >
                              {t.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>

          {/* ─── Section: Region & Locale ────────────────────────── */}
          <SectionCard
            icon={<MapPin className="h-4 w-4" />}
            title="Region & locale"
            description="Used for pricing, tax, and time-based availability."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Country <RequiredMark />
                    </FormLabel>
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={countryOptions}
                      placeholder="Select country"
                      searchPlaceholder="Search country..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Currency <RequiredMark />
                    </FormLabel>
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={currencyOptions}
                      placeholder="Select currency"
                      searchPlaceholder="Search currency..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Timezone <RequiredMark />
                    </FormLabel>
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={timezoneOptions}
                      placeholder="Select timezone"
                      searchPlaceholder="Search timezone..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          {/* ─── Section: Contact ────────────────────────────────── */}
          <SectionCard
            icon={<Globe className="h-4 w-4" />}
            title="Contact details"
            description="Optional — how guests and partners reach you."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        autoComplete="email"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 555-0199"
                        autoComplete="tel"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        autoComplete="url"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          {/* ─── Footer / CTA ─────────────────────────────────────── */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              By creating an organization you agree to the platform terms.
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full sm:w-auto min-w-[200px] gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating organization...
                </>
              ) : (
                <>
                  Create organization
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

/* ─── Small presentational helpers ──────────────────────────── */

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <div className="flex items-start gap-3 border-b bg-muted/30 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background border text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <CardContent className="p-5 space-y-5">{children}</CardContent>
    </Card>
  );
}

export default HandleOnboarding;
