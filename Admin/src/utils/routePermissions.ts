export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard": ["view-dashboard"],

  "/masters": ["view-activity-type", "view-kpis"],
  "/masters/manage-kpis": ["view-kpis"],
  "/masters/event-types": ["view-activity-type"],
  "/masters/event-activities": ["view-sport-activity"],

  "/plans": ["view-plans"],

  "/users": ["list-view-users"],
  "/users/admin": ["list-view-admin"],
  "/users/employees": ["list-view-users"],

  "/teams": ["view-team"],

  "/events": ["view-event"],
  "/events/create": ["create-event"],
  "/events/edit": ["edit-event"],
  "/events/view": ["view-event"],

  "/participant-requests": ["view-list-participants"],

  "/facility": ["view-list-facilities"],
  "/facility/view": ["view-list-facilities"],
  "/facility/request": ["can-approve-or-reject-request"],

  "/cms": ["view-blog-list"],
  "/cms/faq": ["view-blog-list"],
  "/cms/sponsors": ["view-blog-list"],
  "/cms/home-slider": ["view-blog-list"],
  "/cms/blog": ["view-blog-list"],
  "/cms/blog/create": ["create-blog"],
  "/cms/blog/edit": ["edit-blog"],
  "/cms/blog/view": ["view-blog-list"],
  "/cms/media": ["view-blog-list"],
  "/cms/media/create": ["view-blog-list"],
  "/cms/media/edit": ["view-blog-list"],
  "/cms/media/view": ["view-blog-list"],
  "/cms/contact-us": ["view-blog-list"],
  "/cms/contacts": ["view-blog-list"],
  "/cms/contacts/view": ["view-blog-list"],
  "/cms/pages": ["view-blog-list"],
  "/cms/pages/view": ["view-blog-list"],

  "/audit-history": ["view-audit-history"],

  "/eval": ["view-evaluation-list"],
  "/eval/fitness-categories": ["view-fitness-category-list"],
  "/eval/fitness-categories/view": ["view-fitness-category-list"],
  "/eval/fitness-age-groups": ["view-fitness-category-list"],
  "/eval/fitness-score-matrix": ["view-fitness-category-list"],

  "/profile": ["view-profile"],
  "/account-settings": ["view-settings"],
};

export function matchRoutePermission(routePath: string): string[] {
  const exact = ROUTE_PERMISSIONS[routePath];
  if (exact) return exact;

  const matched = Object.entries(ROUTE_PERMISSIONS).find(([pattern]) =>
    routePath.startsWith(pattern + "/") || routePath === pattern
  );
  return matched ? matched[1] : [];
}
