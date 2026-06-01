import axios from 'axios';

/**
 * CTF Flag System API Client Layer
 * Centralizes all HTTP communications with backend CTF endpoints.
 */

const BASE_URL = '/api/ctf';

/**
 * Fetches all active challenges for the current user.
 * @returns {Promise<Array>} List of challenges (with isSolved status, without flags)
 */
export const getChallenges = async () => {
  const response = await axios.get(`${BASE_URL}/challenges`);
  return response.data;
};

/**
 * Submits a flag candidate for evaluation.
 * @param {string} challengeId ID of the target challenge
 * @param {string} flag Flag candidate string
 * @returns {Promise<Object>} Verification results { correct, alreadySolved, pointsAwarded, message }
 */
export const submitFlag = async (challengeId, flag) => {
  const response = await axios.post(`${BASE_URL}/submit`, { challengeId, flag });
  return response.data;
};

/**
 * Fetches the global top 20 leaderboard and the current user's performance metrics.
 * @returns {Promise<Object>} Leaderboard lists and user rank metrics
 */
export const getLeaderboard = async () => {
  const response = await axios.get(`${BASE_URL}/leaderboard`);
  return response.data;
};

/**
 * Fetches the current user's score metrics and per-difficulty solve counts.
 * @returns {Promise<Object>} Score and breakdown details
 */
export const getScore = async () => {
  const response = await axios.get(`${BASE_URL}/score`);
  return response.data;
};
