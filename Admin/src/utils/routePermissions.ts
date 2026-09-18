export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard": ["view-dashboard"],

  "/masters": ["view-activity-type", "view-kpis"],
  "/masters/manage-kpis": ["view-kpis"],
  "/masters/event-types": ["view-activity-type"],
  "/masters/event-activities": ["view-sport-activity"],
  "/masters/plans": ["view-plans"],
  "/masters/faqs": ["view-faq-list"],

  "/plans": ["view-plans"],

  "/users": ["list-view-users"],
  "/users/admin": ["list-view-admin"],
  "/users/employees": ["list-view-users"],

  "/teams": ["view-team"],
  "/manage-team": ["view-team"],

  "/events": ["view-event"],
  "/events/create": ["create-event"],
  "/events/edit": ["edit-event"],
  "/events/view": ["view-event"],
  "/events/:eventId/activities": ["view-event"],

  "/participant-requests": ["view-list-participants"],
  "/participant-requests/view": ["view-list-participants"],
  "/participant-requests/evaluation": ["view-list-participants"],

  "/fitness-evaluation": ["view-evaluation-list"],
  "/fitness-evaluation/edit": ["view-evaluation-list"],

  "/facility": ["view-list-facilities"],
  "/facility/view": ["view-list-facilities"],
  "/facility/request": ["can-approve-or-reject-request"],

  "/cms": ["view-blog-list"],
  "/cms/faq": ["view-faq-list"],
  "/cms/sponsors": ["view-sponsor-list"],
  "/cms/social-links": ["view-social-link-list"],
  "/cms/home-slider": ["view-home-slider-list"],
  "/cms/blog": ["view-blog-list"],
  "/cms/blog/create": ["create-blog"],
  "/cms/blog/edit": ["edit-blog"],
  "/cms/blog/view": ["view-blog-list"],
  "/cms/media": ["view-media-list"],
  "/cms/media/create": ["create-media"],
  "/cms/media/edit": ["edit-media"],
  "/cms/media/view": ["view-media-list"],
  "/cms/contact-us": ["view-contact-list"],
  "/cms/contacts": ["view-contact-list"],
  "/cms/contacts/view": ["view-contact-list"],
  "/cms/pages": ["view-cms-page-list"],
  "/cms/pages/view": ["view-cms-page-list"],
  "/cms/glimpse": ["view-glimpse-list"],

  "/notifications": ["view-notification-list"],

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
