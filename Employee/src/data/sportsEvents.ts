import { EventImg, EventImgThree, EventImgTwo } from "../assets/images/images";

export type SportsEvent = {
  id: string;
  title: string;
  image: string;
  description: string;
  category: string;
  sport: string;
  date: string;
  venue: string;
  participants: string;
  status: string;
};

export const sportsEvents: SportsEvent[] = [
  {
    id: "ride-for-wellness-cycling-day",
    title: "Ride for Wellness - Cycling Day",
    image: EventImg,
    description:
      "A guided cycling event designed to improve endurance, teamwork, and everyday wellness for GDRFA employees.",
    category: "Individual",
    sport: "Cycling",
    date: "Sep 2 to Sep 6 2025, 7:30 AM",
    venue: "Meydan Cycling Track",
    participants: "126 Participants",
    status: "Registration open",
  },
  {
    id: "wellness-week-jog-mindfulness",
    title: "Wellness Week - Jog & Mindfulness",
    image: EventImgTwo,
    description:
      "Daily jogging and guided mindfulness sessions focused on building healthy routines and stress recovery.",
    category: "Group",
    sport: "Running",
    date: "Sep 12 to Sep 16 2025, 6:30 AM",
    venue: "GDRFA Sports Complex",
    participants: "84 Participants",
    status: "Upcoming",
  },
  {
    id: "wellness-week-yoga-mindfulness",
    title: "Wellness Week - Yoga & Mindfulness",
    image: EventImgThree,
    description:
      "Mobility, balance, and breathing sessions for employees looking to improve flexibility and focus.",
    category: "Individual",
    sport: "Yoga",
    date: "Oct 3 to Oct 7 2025, 7:00 AM",
    venue: "Wellness Hall A",
    participants: "72 Participants",
    status: "Upcoming",
  },
  {
    id: "inter-department-football-cup",
    title: "Inter Department Football Cup",
    image: EventImg,
    description:
      "Competitive football fixtures between departments with league rounds, knockout matches, and awards.",
    category: "Team",
    sport: "Football",
    date: "Nov 8 to Nov 28 2025, 5:00 PM",
    venue: "Dubai Police Stadium",
    participants: "16 Teams",
    status: "Draft schedule",
  },
  {
    id: "fitness-evaluation-open-day",
    title: "Fitness Evaluation Open Day",
    image: EventImgTwo,
    description:
      "Open evaluation day for running, cycling, and body fitness metrics with certificate eligibility.",
    category: "Evaluation",
    sport: "Fitness",
    date: "Dec 5 2025, 8:00 AM",
    venue: "GDRFA Performance Lab",
    participants: "210 Participants",
    status: "Registration open",
  },
  {
    id: "swimming-endurance-challenge",
    title: "Swimming Endurance Challenge",
    image: EventImgThree,
    description:
      "A controlled endurance swim challenge with multiple distance brackets for different fitness levels.",
    category: "Individual",
    sport: "Swimming",
    date: "Jan 18 2026, 7:30 AM",
    venue: "Hamdan Sports Complex",
    participants: "58 Participants",
    status: "Upcoming",
  },
];
