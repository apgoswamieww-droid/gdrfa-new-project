import { 
  SportsActivitiesOne, 
  SportsActivitiesTwo, 
  SportsActivitiesThree, 
  SportsActivitiesFour, 
  SportsActivitiesFive 
} from "../assets/images/images";

export type Facility = {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  capacity: string;
  amenities: string[];
};

export const facilities: Facility[] = [
  {
    id: "wellness-yoga-studio",
    title: "Wellness & Yoga Studio – Al Muhaisnah",
    description: "A serene space dedicated to yoga, meditation, and mindfulness sessions. Equipped with high-quality mats, blocks, and a calming sound system.",
    image: SportsActivitiesOne,
    location: "Al Muhaisnah, Dubai",
    capacity: "25 Persons",
    amenities: ["Yoga Mats", "Sound System", "Changing Rooms", "Water Station"],
  },
  {
    id: "indoor-multi-sports",
    title: "Indoor Multi-Sports Court – HQ Sports Hall",
    description: "Versatile indoor court suitable for basketball, volleyball, and badminton. Features professional-grade flooring and climate control.",
    image: SportsActivitiesTwo,
    location: "GDRFA HQ, Dubai",
    capacity: "50 Persons",
    amenities: ["Scoreboard", "Equipment Storage", "AC", "First Aid Kit"],
  },
  {
    id: "employee-fitness-gym",
    title: "GDRFA Employee Fitness Gym – Al Twar HQ",
    description: "A fully-equipped modern gym with cardio machines, free weights, and resistance training equipment for all fitness levels.",
    image: SportsActivitiesThree,
    location: "Al Twar HQ, Dubai",
    capacity: "30 Persons",
    amenities: ["Treadmills", "Free Weights", "Personal Trainers", "Showers"],
  },
  {
    id: "outdoor-fitness-track",
    title: "Outdoor Fitness Track – Al Qusais Facility",
    description: "A professional 400m outdoor track for running and athletic training. Includes a specialized surface for joint protection.",
    image: SportsActivitiesFour,
    location: "Al Qusais, Dubai",
    capacity: "100 Persons",
    amenities: ["Lighting", "Drinking Fountains", "Stretching Area", "Locker Rooms"],
  },
  {
    id: "performance-lab",
    title: "GDRFA Performance Lab – Performance Center",
    description: "Advanced facility for fitness evaluation, body metrics analysis, and personalized performance optimization plans.",
    image: SportsActivitiesFive,
    location: "Dubai Airport Freezone",
    capacity: "10 Persons",
    amenities: ["Body Scanners", "Metabolic Testers", "Consultation Rooms", "Lab Reports"],
  },
];
