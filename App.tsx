

import React, { useState, useCallback, useMemo } from 'react';
import {
  WizardStep,
  FormData,
  GardenPlan,
  Crop,
  EducationalResource,
} from './types';
import {
  WIZARD_STEPS,
  INITIAL_FORM_DATA,
  GARDEN_TYPE_OPTIONS,
  SPACE_OPTIONS,
  SEASON_OPTIONS,
  COMMITMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  CROP_GOAL_OPTIONS,
  PREFERENCE_OPTIONS
} from './constants';
import { generateGardenPlan } from './services/geminiService';
import Spinner from './components/shared/Spinner';
import Card from './components/shared/Card';
import DiseaseIdentifier from './components/DiseaseIdentifier';

// Helper component for Wizard navigation
const WizardNavigation: React.FC<{
  currentStepIndex: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
}> = ({ currentStepIndex, onBack, onNext, isNextDisabled }) => (
  <div className="flex justify-between mt-8">
    <button
      onClick={onBack}
      disabled={currentStepIndex === 0}
      className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300 disabled:opacity-50"
    >
      Back
    </button>
    <button
      onClick={onNext}
      disabled={isNextDisabled}
      className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400"
    >
      {currentStepIndex === WIZARD_STEPS.length - 1 ? 'Generate Plan' : 'Next'}
    </button>
  </div>
);

const ResourceIcon: React.FC<{ type: EducationalResource['type'] }> = ({ type }) => {
  if (type === 'Video') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === 'Course') {
    return (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
      </svg>
    );
  }
  // Article
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.Location);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [gardenPlan, setGardenPlan] = useState<GardenPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleNext = useCallback(() => {
    const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1]);
    } else {
      // Final step, generate plan
      setCurrentStep(WizardStep.Planning);
      setError(null);
      generateGardenPlan(formData)
        .then(plan => {
          setGardenPlan(plan);
          setCurrentStep(WizardStep.Plan);
        })
        .catch(err => {
          console.error("Error generating plan:", err);
          setError("Sorry, we couldn't generate your garden plan. Please try again.");
          setCurrentStep(WizardStep.Photo); // Go back to the last step
        });
    }
  }, [currentStep, formData]);

  const handleBack = useCallback(() => {
    const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentStepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1]);
    }
  }, [currentStep]);

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setGardenPlan(null);
    setError(null);
    setCurrentStep(WizardStep.Location);
  };
  
  const handleUseLocation = () => {
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, location: { ...prev.location, lat: latitude, lng: longitude, address: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` } }));
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Could not get your location. Please enter your address manually.");
        setIsLocating(false);
      }
    );
  };
  
  const handleMultiSelect = (field: keyof FormData | 'goals.crops' | 'goals.preferences', value: string) => {
    if (field === 'goals.crops') {
        const current = formData.goals.crops;
        const updated = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
        setFormData(prev => ({...prev, goals: {...prev.goals, crops: updated}}));
    } else if (field === 'goals.preferences') {
        const current = formData.goals.preferences;
        const updated = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
        setFormData(prev => ({...prev, goals: {...prev.goals, preferences: updated}}));
    } else {
        const current = formData[field as 'gardenTypes' | 'seasons'] as string[];
        const updated = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
        setFormData(prev => ({...prev, [field]: updated}));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setFormData(prev => ({ ...prev, photo: { base64, mimeType: file.type } }));
      };
      reader.readAsDataURL(file);
    }
  };


  const isNextDisabled = useMemo(() => {
    switch (currentStep) {
      case WizardStep.Location:
        return !formData.location.address;
      case WizardStep.GardenType:
        return formData.gardenTypes.length === 0;
      case WizardStep.Space:
        return !formData.space;
      case WizardStep.Seasons:
        return formData.seasons.length === 0;
      case WizardStep.Commitment:
        return !formData.commitment;
      case WizardStep.Experience:
        return !formData.experience;
      case WizardStep.Goals:
        return formData.goals.crops.length === 0 && !formData.goals.notes.includes("suggest");
      default:
        return false;
    }
  }, [currentStep, formData]);
  
  const renderWizardStep = () => {
    const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);

    return (
      <Card className="max-w-4xl mx-auto">
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${((currentStepIndex + 1) / WIZARD_STEPS.length) * 100}%` }}></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">Step {currentStepIndex + 1} of {WIZARD_STEPS.length}</p>
        </div>
        
        {currentStep === WizardStep.Location && (
          <div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">Where is your garden?</h2>
            <p className="mb-6 text-gray-600">Your location helps us recommend plants that will thrive in your climate.</p>
            <input
              type="text"
              placeholder="Enter your address or city"
              value={formData.location.address}
              onChange={(e) => setFormData(prev => ({...prev, location: {...prev.location, address: e.target.value, lat: null, lng: null}}))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="my-4 text-center text-gray-500">OR</div>
            <button onClick={handleUseLocation} disabled={isLocating} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition duration-300 flex items-center justify-center disabled:bg-gray-400">
              {isLocating ? <Spinner /> : 'Use My Current Location'}
            </button>
            {formData.location.lat && formData.location.lng && (
               <div className="mt-6 p-4 bg-green-100 rounded-lg text-center border border-green-200">
                <h3 className="font-semibold text-green-800">Location Confirmed</h3>
                <p className="text-gray-700 text-sm">Your coordinates will be used for AI planning:</p>
                <p className="text-gray-900 font-mono my-2 text-lg bg-white rounded-md p-2 inline-block shadow-sm">{`Lat: ${formData.location.lat.toFixed(4)}, Lng: ${formData.location.lng.toFixed(4)}`}</p>
                 <div className="bg-gray-200 border border-gray-300 rounded-md mt-2 shadow-inner w-full aspect-video flex flex-col items-center justify-center text-gray-600 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="font-semibold">Map Preview Unavailable</p>
                    <p className="text-sm text-center">Your coordinates have been captured and will be used for planning.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === WizardStep.GardenType && (
          <div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">What type of garden are you dreaming of?</h2>
            <p className="mb-6 text-gray-600">Select all growing methods you plan to use.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GARDEN_TYPE_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.gardenTypes.includes(opt) ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                  <input type="checkbox" checked={formData.gardenTypes.includes(opt)} onChange={() => handleMultiSelect('gardenTypes', opt)} className="h-5 w-5 text-green-600 rounded focus:ring-green-500" />
                  <span className="ml-3 text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === WizardStep.Space && (
          <div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">How much space do you have?</h2>
            <p className="mb-6 text-gray-600">This helps us understand the scale of your growing area.</p>
            <div className="space-y-3">
              {SPACE_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.space === opt ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                  <input type="radio" name="space" value={opt} checked={formData.space === opt} onChange={(e) => setFormData(prev => ({...prev, space: e.target.value}))} className="h-5 w-5 text-green-600 focus:ring-green-500" />
                  <span className="ml-3 text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === WizardStep.Environment && (
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">Will you be gardening indoors, outdoors, or both?</h2>
               <div className="space-y-3">
                 {['Indoor', 'Outdoor', 'Both'].map(opt => (
                    <label key={opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.environment === opt.toLowerCase() ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                      <input type="radio" name="environment" value={opt.toLowerCase()} checked={formData.environment === opt.toLowerCase()} onChange={(e) => setFormData(prev => ({...prev, environment: e.target.value}))} className="h-5 w-5 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 text-gray-700">{opt}</span>
                    </label>
                 ))}
               </div>
            </div>
        )}

        {currentStep === WizardStep.Seasons && (
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">Which seasons do you plan to garden in?</h2>
              <p className="mb-6 text-gray-600">Select all that apply.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SEASON_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.seasons.includes(opt) ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                  <input type="checkbox" checked={formData.seasons.includes(opt)} onChange={() => handleMultiSelect('seasons', opt)} className="h-5 w-5 text-green-600 rounded focus:ring-green-500" />
                  <span className="ml-3 text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            </div>
        )}

        {currentStep === WizardStep.Commitment && (
             <div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">How much time can you commit?</h2>
               <p className="mb-6 text-gray-600">We'll match plants to your schedule.</p>
               <div className="space-y-3">
              {COMMITMENT_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.commitment === opt ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                  <input type="radio" name="commitment" value={opt} checked={formData.commitment === opt} onChange={(e) => setFormData(prev => ({...prev, commitment: e.target.value}))} className="h-5 w-5 text-green-600 focus:ring-green-500" />
                  <span className="ml-3 text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            </div>
        )}

        {currentStep === WizardStep.Experience && (
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">What's your gardening experience?</h2>
               <p className="mb-6 text-gray-600">We'll tailor recommendations to your skill level.</p>
               <div className="space-y-3">
              {EXPERIENCE_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.experience === opt ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                  <input type="radio" name="experience" value={opt} checked={formData.experience === opt} onChange={(e) => setFormData(prev => ({...prev, experience: e.target.value}))} className="h-5 w-5 text-green-600 focus:ring-green-500" />
                  <span className="ml-3 text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            </div>
        )}

        {currentStep === WizardStep.Goals && (
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">What are your garden goals?</h2>
              <p className="mb-6 text-gray-600">Tell us what you want to grow and your preferences.</p>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">What would you like to grow?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CROP_GOAL_OPTIONS.map(opt => (
                    <label key={opt} className={`flex items-center p-3 border rounded-lg text-sm cursor-pointer transition-colors ${formData.goals.crops.includes(opt) ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                      <input type="checkbox" checked={formData.goals.crops.includes(opt)} onChange={() => handleMultiSelect('goals.crops', opt)} className="h-4 w-4 text-green-600 rounded focus:ring-green-500" />
                      <span className="ml-2 text-gray-700">{opt}</span>
                    </label>
                  ))}
                   <label className={`flex items-center p-3 border rounded-lg text-sm cursor-pointer transition-colors ${formData.goals.crops.includes("I don't know - suggest crops for me") ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                      <input type="checkbox" checked={formData.goals.crops.includes("I don't know - suggest crops for me")} onChange={() => handleMultiSelect('goals.crops', "I don't know - suggest crops for me")} className="h-4 w-4 text-green-600 rounded focus:ring-green-500" />
                      <span className="ml-2 text-gray-700">Suggest for me</span>
                    </label>
                </div>
              </div>
               <div className="mb-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">Any specific preferences?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PREFERENCE_OPTIONS.map(opt => (
                    <label key={opt} className={`flex items-center p-3 border rounded-lg text-sm cursor-pointer transition-colors ${formData.goals.preferences.includes(opt) ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                      <input type="checkbox" checked={formData.goals.preferences.includes(opt)} onChange={() => handleMultiSelect('goals.preferences', opt)} className="h-4 w-4 text-green-600 rounded focus:ring-green-500" />
                      <span className="ml-2 text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
               <div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3">Additional notes or special requirements?</h3>
                <textarea
                  value={formData.goals.notes}
                  onChange={(e) => setFormData(prev => ({...prev, goals: {...prev.goals, notes: e.target.value}}))}
                  placeholder="e.g., 'I have very sandy soil', 'I want to attract pollinators', 'My balcony gets morning sun only'"
                  className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                ></textarea>
              </div>
            </div>
        )}

        {currentStep === WizardStep.Photo && (
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">AI Garden Photo Planner (Optional)</h2>
              <p className="mb-6 text-gray-600">Upload a photo of your garden space. Our AI will use it to suggest optimal plant placement.</p>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
              />
              {formData.photo && <img src={`data:${formData.photo.mimeType};base64,${formData.photo.base64}`} alt="Garden preview" className="mt-4 rounded-lg shadow-md max-h-64 w-auto" />}
            </div>
        )}

        <WizardNavigation
          currentStepIndex={currentStepIndex}
          onBack={handleBack}
          onNext={handleNext}
          isNextDisabled={isNextDisabled}
        />
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </Card>
    );
  };
  
  const renderPlan = () => {
    if (!gardenPlan) return null;

    const groupedCrops = gardenPlan.cropRecommendations.reduce((acc, crop) => {
      const type = crop.type || 'Other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(crop);
      return acc;
    }, {} as Record<string, Crop[]>);


    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-green-800">Your Personalized Garden Plan</h1>
          <p className="mt-2 text-lg text-gray-600">Here's your custom-tailed guide to a successful harvest!</p>
           <button onClick={handleReset} className="mt-6 bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300">Start a New Plan</button>
        </div>
        
        <Card>
          <h2 className="text-2xl font-bold text-green-800 mb-6">Crop Recommendations</h2>
          <div className="space-y-8">
            {Object.entries(groupedCrops).map(([type, crops]) => (
              <div key={type}>
                <h3 className="text-xl font-bold text-green-900 mb-4 capitalize border-b-2 border-green-200 pb-2">{type}s</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {crops.map(crop => (
                    <div key={crop.cropName} className="p-4 bg-green-50 rounded-lg border border-green-200 h-full flex flex-col">
                      <h4 className="font-bold text-lg text-green-900">{crop.cropName}</h4>
                      <p className="text-sm text-gray-600 mt-1 flex-grow">{crop.keyBenefits}</p>
                      <div className="mt-3 text-sm space-y-1 pt-2 border-t border-green-100">
                        <p><strong className="font-semibold">Season:</strong> {crop.growingSeason}</p>
                        <p><strong className="font-semibold">Maturity:</strong> {crop.timeToMaturity}</p>
                        <p><strong className="font-semibold">Sun:</strong> {crop.sunlightNeeds}</p>
                        <p><strong className="font-semibold">Water:</strong> {crop.waterNeeds}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <h2 className="text-2xl font-bold text-green-800 mb-4">Garden Layout Plan</h2>
                <div className="prose prose-green max-w-none" dangerouslySetInnerHTML={{ __html: gardenPlan.gardenLayout.replace(/\n/g, '<br />') }}></div>
            </Card>
             <Card>
                <h2 className="text-2xl font-bold text-green-800 mb-4">Planting Schedule</h2>
                <div className="prose prose-green max-w-none" dangerouslySetInnerHTML={{ __html: gardenPlan.plantingSchedule.replace(/\n/g, '<br />') }}></div>
            </Card>
        </div>

        <Card>
          <h2 className="text-2xl font-bold text-green-800 mb-4">Educational Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gardenPlan.educationalResources.map(res => (
              <a 
                key={res.uri} 
                href={res.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-lg hover:border-green-400 transition-all duration-300 group"
              >
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                        <ResourceIcon type={res.type} />
                    </div>
                    <div className="ml-4">
                        <p className="font-semibold text-green-900 group-hover:text-blue-600 transition-colors">{res.title}</p>
                        <span className="inline-block bg-green-200 text-green-800 text-xs font-medium mt-2 px-2.5 py-0.5 rounded-full">{res.type}</span>
                    </div>
                </div>
              </a>
            ))}
          </div>
        </Card>
        
        <DiseaseIdentifier />
      </div>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case WizardStep.Planning:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-green-800 mb-4">Cultivating Your Plan...</h2>
            <p className="text-gray-600 mb-8">Our AI is analyzing your unique garden conditions to create the perfect plan.</p>
            <Spinner />
          </div>
        );
      case WizardStep.Plan:
        return renderPlan();
      default:
        return renderWizardStep();
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-800">Agentic AI Garden Planner</h1>
        <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">Your personal AI horticulturalist for a thriving garden.</p>
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;