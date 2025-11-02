
import React, { useState, useCallback } from 'react';
import { identifyPlantDisease } from '../services/geminiService';
import type { DiseaseInfo } from '../types';
import Spinner from './shared/Spinner';
import Card from './shared/Card';

const DiseaseIdentifier: React.FC = () => {
  const [photo, setPhoto] = useState<{ file: File, preview: string } | null>(null);
  const [result, setResult] = useState<DiseaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto({ file, preview: URL.createObjectURL(file) });
      setResult(null);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleIdentify = useCallback(async () => {
    if (!photo) return;
    setIsLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(photo.file);
      const res = await identifyPlantDisease({ base64, mimeType: photo.file.type });
      setResult(res);
    } catch (err) {
      setError('Failed to identify disease. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [photo]);

  return (
    <Card className="mt-8">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Plant Disease Identifier</h2>
      <p className="text-gray-600 mb-6">Worried about a plant? Upload a photo, and our AI will help identify potential issues.</p>
      
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
        />

        {photo && (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img src={photo.preview} alt="Plant preview" className="w-48 h-48 object-cover rounded-lg shadow-md" />
            <button
              onClick={handleIdentify}
              disabled={isLoading}
              className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
            >
              {isLoading ? <Spinner /> : 'Identify Disease'}
            </button>
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-xl font-semibold text-green-900">{result.disease}</h3>
            <p className="mt-2 text-gray-700"><strong className="font-semibold">Description:</strong> {result.description}</p>
            <p className="mt-2 text-gray-700"><strong className="font-semibold">Suggested Treatment:</strong> {result.treatment}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DiseaseIdentifier;
