import { useState, useEffect } from 'react';
import type { TripData, RoadSamples } from '../playback/types';

export function useDataLoader() {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [roadSamples, setRoadSamples] = useState<RoadSamples | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [tripRes, roadRes] = await Promise.all([
          fetch('/data/trip17.json'),
          fetch('/data/road_samples.json'),
        ]);

        if (!tripRes.ok) throw new Error('Failed to load trip data');
        if (!roadRes.ok) throw new Error('Failed to load road samples');

        const trip: TripData = await tripRes.json();
        const road: RoadSamples = await roadRes.json();

        setTripData(trip);
        setRoadSamples(road);
        setLoading(false);
      } catch (e) {
        setError((e as Error).message);
        setLoading(false);
      }
    }
    load();
  }, []);

  return { tripData, roadSamples, loading, error };
}
