import { EventImg, EventImgTwo, EventImgThree } from "../assets/images/images";

export type ParticipatedEvent = {
  id: string;
  title: string;
  image: string;
  date: string;
  sport: string;
  category: string;
  result?: string;
  status: "Completed" | "Registered" | "In Progress";
};

export type Certificate = {
  id: string;
  title: string;
  issueDate: string;
  eventName: string;
  category: string;
  previewUrl: string;
};

export type AchievementStats = {
  totalEvents: number;
  totalPoints: number;
  rank: string;
  nextRank: string;
  progressToNext: number;
};

export const participatedEvents: ParticipatedEvent[] = [
  {
    id: "ride-for-wellness-cycling-day",
    title: "Ride for Wellness - Cycling Day",
    image: EventImg,
    date: "Sep 2 - Sep 6, 2025",
    sport: "Cycling",
    category: "Individual",
    result: "Top 10 Finish",
    status: "Completed",
  },
  {
    id: "wellness-week-yoga-mindfulness",
    title: "Wellness Week - Yoga & Mindfulness",
    image: EventImgThree,
    date: "Oct 3 - Oct 7, 2025",
    sport: "Yoga",
    category: "Individual",
    status: "Completed",
  },
  {
    id: "inter-department-football-cup",
    title: "Inter Department Football Cup",
    image: EventImg,
    date: "Nov 8 - Nov 28, 2025",
    sport: "Football",
    category: "Team",
    result: "Winner",
    status: "Completed",
  },
  {
    id: "fitness-evaluation-open-day",
    title: "Fitness Evaluation Open Day",
    image: EventImgTwo,
    date: "Dec 5, 2025",
    sport: "Fitness",
    category: "Evaluation",
    status: "Registered",
  },
];

export const certificates: Certificate[] = [
  {
    id: "cert-001",
    title: "Cycling Endurance Completion",
    issueDate: "Sep 15, 2025",
    eventName: "Ride for Wellness - Cycling Day",
    category: "Participation",
    previewUrl: "/assets/certificates/cycling-cert.pdf",
  },
  {
    id: "cert-002",
    title: "Inter-Department Football Winner",
    issueDate: "Nov 30, 2025",
    eventName: "Inter Department Football Cup",
    category: "Winning",
    previewUrl: "/assets/certificates/football-winner.pdf",
  },
  {
    id: "cert-003",
    title: "Wellness Week Yoga Master",
    issueDate: "Oct 10, 2025",
    eventName: "Wellness Week - Yoga & Mindfulness",
    category: "Achievement",
    previewUrl: "/assets/certificates/yoga-master.pdf",
  },
];

export type FacilityRequest = {
  id: string;
  facilityName: string;
  date: string;
  slot: string;
  status: "Pending" | "Approved" | "Rejected";
  reason?: string;
};

export const facilityRequests: FacilityRequest[] = [
  {
    id: "req-001",
    facilityName: "Wellness & Yoga Studio – Al Muhaisnah",
    date: "2025-10-15",
    slot: "10:00 AM",
    status: "Approved",
  },
  {
    id: "req-002",
    facilityName: "Indoor Multi-Sports Court – HQ Sports Hall",
    date: "2025-11-02",
    slot: "05:00 PM",
    status: "Rejected",
    reason: "Facility undergoing maintenance on the selected date.",
  },
  {
    id: "req-003",
    facilityName: "GDRFA Employee Fitness Gym – Al Twar HQ",
    date: "2025-12-10",
    slot: "08:00 AM",
    status: "Pending",
  },
];

export const achievementStats: AchievementStats = {
  totalEvents: 12,
  totalPoints: 1250,
  rank: "Elite Athlete",
  nextRank: "GDRFA Legend",
  progressToNext: 75,
};
