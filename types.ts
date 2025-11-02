
export enum WizardStep {
  Location,
  GardenType,
  Space,
  Environment,
  Seasons,
  Commitment,
  Experience,
  Goals,
  Photo,
  Planning,
  Plan,
}

export interface FormData {
  location: {
    address: string;
    lat: number | null;
    lng: number | null;
  };
  gardenTypes: string[];
  space: string;
  environment: string;
  seasons: string[];
  commitment: string;
  experience: string;
  goals: {
    crops: string[];
    preferences: string[];
    notes: string;
  };
  photo: {
    base64: string;
    mimeType: string;
  } | null;
}

export interface Crop {
  cropName: string;
  type: string;
  growingSeason: string;
  timeToMaturity: string;
  expectedOutput: string;
  sunlightNeeds: string;
  waterNeeds: string;
  keyBenefits: string;
}

export interface EducationalResource {
  title: string;
  uri: string;
  type: 'Article' | 'Video' | 'Course';
}

export interface GardenPlan {
  cropRecommendations: Crop[];
  gardenLayout: string;
  plantingSchedule: string;
  educationalResources: EducationalResource[];
}

export interface DiseaseInfo {
  disease: string;
  description: string;
  treatment: string;
}
