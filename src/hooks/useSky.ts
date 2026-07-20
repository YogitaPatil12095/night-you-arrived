import { useMemo } from 'react';
import type { CardData, SkyResult } from '../types/card';
import { computeSky } from '../astronomy/skyEngine';
import { resolveObservationMoment } from '../utils/dateTime';

export function useSky(data: CardData): SkyResult | null {
  return useMemo(() => {
    if (!data.birthDate || !data.location) return null;
    const moment = resolveObservationMoment(data);
    return computeSky(moment, data.location);
  }, [data.birthDate, data.birthTime, data.location, data.timeIsApproximate]);
}
