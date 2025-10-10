import { LeetCode } from "leetcode-query";

// implement caching or storage of questions later

const leetcode = new LeetCode();

export const getDailyProblem = async () => {
  const dailyProblem = await leetcode.daily();
  return dailyProblem;
};
