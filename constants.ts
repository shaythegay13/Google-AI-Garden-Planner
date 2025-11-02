
import { WizardStep, FormData } from './types';

export const WIZARD_STEPS = [
  WizardStep.Location,
  WizardStep.GardenType,
  WizardStep.Space,
  WizardStep.Environment,
  WizardStep.Seasons,
  WizardStep.Commitment,
  WizardStep.Experience,
  WizardStep.Goals,
  WizardStep.Photo,
];

export const INITIAL_FORM_DATA: FormData = {
  location: { address: '', lat: null, lng: null },
  gardenTypes: [],
  space: '',
  environment: 'outdoor',
  seasons: [],
  commitment: '',
  experience: '',
  goals: { crops: [], preferences: [], notes: '' },
  photo: null,
};

export const GARDEN_TYPE_OPTIONS = [
  "Container Garden (pots, planters)",
  "Raised Bed Garden",
  "Traditional In-Ground Garden",
  "Vertical Garden (wall-mounted)",
  "Indoor Garden (windowsill, grow lights)",
  "Rooftop Garden",
  "Hydroponic",
];

export const SPACE_OPTIONS = [
  "Small (windowsill, few containers)",
  "Medium (balcony, small patio)",
  "Large (backyard, rooftop)",
  "Very Large (community garden plot)",
];

export const SEASON_OPTIONS = [
  "Spring (March-May)",
  "Summer (June-August)",
  "Fall (September-November)",
  "Winter (December-February)",
];

export const COMMITMENT_OPTIONS = [
  "Minimal (check weekly)",
  "Moderate (few times per week)",
  "Dedicated (daily care)",
];

export const EXPERIENCE_OPTIONS = [
  "Beginner (never grown anything before)",
  "Novice (grown a few plants)",
  "Intermediate (successful garden seasons)",
  "Advanced (experienced gardener)",
];

export const CROP_GOAL_OPTIONS = [
  "Leafy Greens (lettuce, spinach, kale)",
  "Herbs (basil, parsley, cilantro, mint)",
  "Tomatoes",
  "Peppers",
  "Root Vegetables (carrots, radishes, beets)",
  "Microgreens",
  "Onions and Garlic",
  "Beans and Peas",
  "Squash and Cucumbers",
];

export const PREFERENCE_OPTIONS = [
  "Drought Resistant",
  "Native Plants",
  "Low Maintenance",
  "Pest Resistant",
  "Fast Growing",
];
