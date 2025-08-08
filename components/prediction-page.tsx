'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { AppState } from '@/app/page';
import type { SubscriptionTier, UserSubscription } from '@/types/subscription';
import { TIER_CONFIG } from '@/types/subscription';
import {
  Loader2,
  ArrowLeft,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Crown,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { makePrediction, fetchUserSubscription } from '@/lib/api-client';

// Dynamically import the map component to avoid SSR issues
const InteractiveMap = dynamic(() => import('@/components/interactive-map'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-full min-h-[280px] max-h-[400px] rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <MapPin className='mx-auto h-8 w-8 text-gray-400 mb-2' />
        <p className='text-gray-600'>Loading map...</p>
      </div>
    </div>
  ),
});

export interface PredictionResponse {
  prediction_for_date: string;
  predicted_label: 'toxic' | 'non_toxic';
  confidence_scores: {
    non_toxic: string;
    toxic: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  processing_time: string;
}

interface PredictionPageProps {
  username: string;
  userTier: SubscriptionTier;
  updateAppState: (updates: Partial<AppState>) => void;
  prediction: PredictionResponse | null;
  canMakeApiCall: () => Promise<boolean>;
  updateApiUsage: () => void;
  getUserSubscription: () => Promise<UserSubscription | null>;
}

export default function PredictionPage({
  username,
  userTier,
  updateAppState,
  prediction,
  canMakeApiCall,
  updateApiUsage,
  getUserSubscription,
}: PredictionPageProps) {
  const tierConfig = TIER_CONFIG[userTier];

  const [lat, setLat] = useState(27.613345);
  const [lon, setLon] = useState(-82.739146);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  // Fetch subscription info on mount
  React.useEffect(() => {
    getUserSubscription().then(setSubscription);
  }, [getUserSubscription]);

  const handleLocationSelect = (newLat: number, newLon: number) => {
    setLat(newLat);
    setLon(newLon);
    setError('');
  };

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLat = Number.parseFloat(e.target.value);
    if (!isNaN(newLat)) {
      setLat(newLat);
    }
  };

  const handleLonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLon = Number.parseFloat(e.target.value);
    if (!isNaN(newLon)) {
      setLon(newLon);
    }
  };

  const validateInputs = async () => {
    if (!lat || !lon) {
      setError('Please provide valid latitude and longitude.');
      return false;
    }
    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90 degrees.');
      return false;
    }
    if (lon < -180 || lon > 180) {
      setError('Longitude must be between -180 and 180 degrees.');
      return false;
    }
    if (!selectedDate) {
      setError('Please select a valid date.');
      return false;
    }
    // Check API call limits
    const canCall = await canMakeApiCall();
    if (!canCall) {
      setError(
        `You've reached your monthly limit of ${tierConfig.apiCallsPerMonth} requests. Upgrade your plan for more calls.`
      );
      return false;
    }
    return true;
  };

  const handleLogout = () => {
    localStorage.removeItem('hab_session');
    updateAppState({
      loggedIn: false,
      username: '',
      userTier: 'free',
      page: 'login',
      prediction: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    if (!(await validateInputs())) {
      setLoading(false);
      return;
    }

    const payload = {
      latitude: lat,
      longitude: lon,
      date: selectedDate,
      tier: userTier,
    };

    try {
      const result = await makePrediction(payload);

      // Add location and tier info to the prediction result
      const enhancedResult = {
        ...result,
        location: {
          latitude: lat,
          longitude: lon,
        },
      };

      updateAppState({ prediction: enhancedResult });

      // Optionally refetch subscription info
      getUserSubscription().then(setSubscription);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during prediction.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-500';
      case 'tier1':
        return 'bg-blue-500';
      case 'tier2':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='min-h-screen p-4'>
      <div className='absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30' />
      <div className='relative max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold text-teal-700'>HAB Prediction</h1>
            <Badge className={`${getTierBadgeColor(userTier)} text-white`}>
              {tierConfig.displayName}
            </Badge>
          </div>
          <Button onClick={handleLogout} variant='outline'>
            Logout
          </Button>
        </div>

        {/* Tier Info Banner */}
        <Card className='backdrop-blur-sm bg-white/80 border-0 mb-6'>
          <CardContent className='py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Crown className='w-5 h-5 text-purple-600' />
                <div>
                  <div className='font-semibold'>
                    {tierConfig.accuracy} Accuracy • {tierConfig.processingTime} •{' '}
                    {tierConfig.predictionDays}-day predictions
                  </div>
                  <div className='text-sm text-gray-600'>
                    API Usage: {subscription?.apiCallsUsed || 0} /{' '}
                    {tierConfig.apiCallsPerMonth} calls this month
                  </div>
                </div>
              </div>
              {userTier === 'free' && (
                <Button
                  onClick={() => updateAppState({ page: 'subscription' })}
                  size='sm'
                  className='bg-purple-600 hover:bg-purple-700'
                >
                  Upgrade Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className='grid lg:grid-cols-2 gap-6 mb-6'>
          <Card className='backdrop-blur-sm bg-white/80 border-0'>
            <CardHeader>
              <CardTitle className='text-teal-700 flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                Prediction Input
                <Badge variant='outline' className='text-xs'>
                  Global Access
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='latitude'>Latitude</Label>
                    <Input
                      id='latitude'
                      type='number'
                      step='0.000001'
                      value={lat}
                      onChange={handleLatChange}
                      className='font-mono'
                      min='-90'
                      max='90'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='longitude'>Longitude</Label>
                    <Input
                      id='longitude'
                      type='number'
                      step='0.000001'
                      value={lon}
                      onChange={handleLonChange}
                      className='font-mono'
                      min='-180'
                      max='180'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='date'>
                    Start Date for {tierConfig.predictionDays}-day Window
                  </Label>
                  <Input
                    id='date'
                    type='date'
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className='text-sm text-gray-600'>
                    The model will predict HAB status for{' '}
                    {tierConfig.predictionDays} days after this date.
                  </p>
                </div>

                <Button
                  type='submit'
                  className='w-full bg-teal-600 hover:bg-teal-700'
                  disabled={loading || !(subscription && subscription.apiCallsUsed < tierConfig.apiCallsPerMonth)}
                >
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Processing ({tierConfig.processingTime})...
                    </>
                  ) : subscription && subscription.apiCallsUsed >= tierConfig.apiCallsPerMonth ? (
                    `Upgrade for more requests (${subscription.apiCallsUsed}/${tierConfig.apiCallsPerMonth})`
                  ) : (
                    'Get HAB Prediction'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className='backdrop-blur-sm bg-white/80 border-0 flex flex-col'>
            <CardHeader className='flex-shrink-0'>
              <CardTitle className='text-teal-700'>Interactive Map</CardTitle>
              <p className='text-sm text-gray-600'>
                Click anywhere on the map to select coordinates
              </p>
            </CardHeader>
            <CardContent className='flex-1 flex flex-col min-h-0'>
              <div
                className='w-full'
                style={{ minHeight: '400px', height: '400px' }}
              >
                <InteractiveMap
                  lat={lat}
                  lon={lon}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant='destructive' className='mb-6'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {prediction && (
          <Card className='backdrop-blur-sm bg-white/80 border-0 mb-6'>
            <CardHeader>
              <CardTitle className='text-teal-700 flex items-center gap-2'>
                {prediction.predicted_label === 'toxic' ? (
                  <AlertTriangle className='h-5 w-5 text-red-600' />
                ) : (
                  <CheckCircle className='h-5 w-5 text-green-600' />
                )}
                Prediction Results for {prediction.prediction_for_date}
                {prediction.location && (
                  <span className='text-sm font-normal text-gray-600 ml-2'>
                    at ({prediction.location.latitude.toFixed(4)},{' '}
                    {prediction.location.longitude.toFixed(4)})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div
                    className={`p-6 rounded-lg border-2 ${
                      prediction.predicted_label === 'toxic'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-green-50 border-green-200 text-green-800'
                    }`}
                  >
                    <div className='flex items-center gap-3 mb-2'>
                      {prediction.predicted_label === 'toxic' ? (
                        <AlertTriangle className='h-6 w-6' />
                      ) : (
                        <CheckCircle className='h-6 w-6' />
                      )}
                      <h3 className='font-bold text-xl'>
                        {prediction.predicted_label === 'toxic'
                          ? 'TOXIC'
                          : 'NON-TOXIC'}
                      </h3>
                    </div>
                    <p className='text-sm opacity-90'>
                      {prediction.predicted_label === 'toxic'
                        ? 'Harmful algal bloom detected - water may be unsafe'
                        : 'No harmful algal bloom detected - water appears safe'}
                    </p>
                  </div>

                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <h4 className='font-semibold text-gray-700 mb-3'>
                      Probability
                    </h4>
                    <div className='space-y-3'>
                      <div>
                        <div className='flex justify-between items-center mb-1'>
                          <span className='text-sm font-medium'>Non-Toxic</span>
                          <span className='text-sm font-mono'>
                            {(
                              Number.parseFloat(
                                prediction.confidence_scores.non_toxic
                              ) * 100
                            ).toFixed(2)}
                            %
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-green-500 h-2 rounded-full transition-all duration-500'
                            style={{
                              width: `${
                                Number.parseFloat(
                                  prediction.confidence_scores.non_toxic
                                ) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className='flex justify-between items-center mb-1'>
                          <span className='text-sm font-medium'>Toxic</span>
                          <span className='text-sm font-mono'>
                            {(
                              Number.parseFloat(
                                prediction.confidence_scores.toxic
                              ) * 100
                            ).toFixed(2)}
                            %
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-red-500 h-2 rounded-full transition-all duration-500'
                            style={{
                              width: `${
                                Number.parseFloat(
                                  prediction.confidence_scores.toxic
                                ) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <h4 className='font-semibold text-gray-700 mb-2'>
                      Prediction Details
                    </h4>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span>Target Date:</span>
                        <span className='font-mono'>
                          {prediction.prediction_for_date}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Location:</span>
                        <span className='font-mono'>
                          {prediction.location
                            ? `${prediction.location.latitude.toFixed(6)}, ${prediction.location.longitude.toFixed(6)}`
                            : `${lat.toFixed(6)}, ${lon.toFixed(6)}`}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Processing Time:</span>
                        <span>
                          {prediction.processing_time} 
                          {/* ||                            tierConfig.processingTime} */}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Subscription:</span>
                        <span>{tierConfig.displayName}</span>
                      </div>
                    </div>
                  </div>

                  <details className='bg-gray-50 p-4 rounded-lg'>
                    <summary className='cursor-pointer font-semibold text-gray-700'>
                      View Raw API Response
                    </summary>
                    <pre className='mt-3 text-xs overflow-auto bg-white p-3 rounded border'>
                      {JSON.stringify(prediction, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={() => updateAppState({ page: 'main' })}
          variant='outline'
          className='mb-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}