import { GOOGLE_MAPS_API_KEY } from '@env';

interface EnvironmentVariables {
  GOOGLE_MAPS_API_KEY: string | undefined;
}

const env: EnvironmentVariables = {
  GOOGLE_MAPS_API_KEY,
};

if (!env.GOOGLE_MAPS_API_KEY) {
  console.warn("GOOGLE_MAPS_API_KEY is not set in .env file. Please ensure it is configured.");
}

export default env;
