import { 
  SportsActivitiesOne, 
  SportsActivitiesTwo, 
  SportsActivitiesThree, 
  SportsActivitiesFour, 
  SportsActivitiesFive 
} from "../assets/images/images";

export type Sponsor = {
  id: string;
  name: string;
  logo: string;
  website: string;
  category: "Platinum" | "Gold" | "Silver" | "Partner";
};

export const sponsors: Sponsor[] = [
  {
    id: "sp-1",
    name: "Emirates",
    logo: SportsActivitiesOne, // Using available images as placeholders for logos
    website: "https://www.emirates.com",
    category: "Platinum",
  },
  {
    id: "sp-2",
    name: "Dubai Duty Free",
    logo: SportsActivitiesTwo,
    website: "https://www.dubaidutyfree.com",
    category: "Platinum",
  },
  {
    id: "sp-3",
    name: "Etisalat",
    logo: SportsActivitiesThree,
    website: "https://www.etisalat.ae",
    category: "Gold",
  },
  {
    id: "sp-4",
    name: "DP World",
    logo: SportsActivitiesFour,
    website: "https://www.dpworld.com",
    category: "Gold",
  },
  {
    id: "sp-5",
    name: "Dubai Police",
    logo: SportsActivitiesFive,
    website: "https://www.dubaipolice.gov.ae",
    category: "Silver",
  },
  {
    id: "sp-6",
    name: "Meydan",
    logo: SportsActivitiesOne,
    website: "https://www.meydan.ae",
    category: "Silver",
  },
  {
    id: "sp-7",
    name: "Roads and Transport Authority",
    logo: SportsActivitiesTwo,
    website: "https://www.rta.ae",
    category: "Partner",
  },
  {
    id: "sp-8",
    name: "Dubai Health Authority",
    logo: SportsActivitiesThree,
    website: "https://www.dha.gov.ae",
    category: "Partner",
  },
];
