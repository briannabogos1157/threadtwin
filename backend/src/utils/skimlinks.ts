import dotenv from 'dotenv';

dotenv.config();

export const SKIMLINKS_CONFIG = {
  clientId: process.env.SKIMLINKS_CLIENT_ID,
  clientSecret: process.env.SKIMLINKS_CLIENT_SECRET,
  publisherId: process.env.SKIMLINKS_PUBLISHER_ID,
  userId: process.env.SKIMLINKS_USER_ID
};

export const getSkimlinksHeaders = () => {
  const { clientId, clientSecret } = SKIMLINKS_CONFIG;
  
  if (!clientId || !clientSecret) {
    throw new Error('Skimlinks credentials not properly configured');
  }

  return {
    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    'Content-Type': 'application/json'
  };
};

export const validateSkimlinksConfig = () => {
  const { clientId, clientSecret, publisherId, userId } = SKIMLINKS_CONFIG;
  
  if (!clientId || !clientSecret || !publisherId || !userId) {
    throw new Error('Missing required Skimlinks configuration. Please check your environment variables.');
  }
  
  return true;
}; 