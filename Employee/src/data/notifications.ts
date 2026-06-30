export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "event" | "certificate" | "fitness";
  unread?: boolean;
};

export const notifications: NotificationItem[] = [
  {
    id: 1,
    title: "Cycling Day registration confirmed",
    message: "You are added to Ride for Wellness - Cycling Day participants list.",
    time: "10 min ago",
    type: "event",
    unread: true,
  },
  {
    id: 2,
    title: "Evaluation certificate ready",
    message: "Your latest body fitness certificate is available for review.",
    time: "2 hours ago",
    type: "certificate",
    unread: true,
  },
  {
    id: 3,
    title: "Fitness score updated",
    message: "Your running score increased by 8 points after the last evaluation.",
    time: "Yesterday",
    type: "fitness",
  },
];
