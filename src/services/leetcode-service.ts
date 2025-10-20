import { LeetCode } from "leetcode-query";
import type { Problem } from "leetcode-query";
import { redis } from "../lib/redis-client.js";

const leetcode = new LeetCode();

export const getDailyProblem = async () => {
  const todayUTC = new Date().toISOString().slice(0, 10);
  const todayKey = `leetcode:daily:${todayUTC}`;
  const cachedId = await redis.get<string>(todayKey);
  if (cachedId) return getProblemByIdOrSlug(cachedId);
  console.debug(`Daily for ${todayUTC} not cached, fetching...`);

  const dailyProblem = await leetcode.daily();
  if (!dailyProblem || dailyProblem.date !== todayUTC) return null;
  console.debug(`Daily fetched successfully`);

  await redis.set(todayKey, dailyProblem.question.titleSlug);
  // this will technically fetch the problem twice the first, but it's not really a big deal
  return getProblemByIdOrSlug(dailyProblem.question.titleSlug);
};

export const getProblemByIdOrSlug = async (idOrSlug: string) => {
  const cacheKey = `leetcode:problem:${idOrSlug}`;
  const cached = await redis.getJson<Problem>(cacheKey);
  if (cached) return cached;

  let slug = idOrSlug;
  let problem = null;
  // if the input is a numeric frontend id, try searching for it
  if (/^\d+$/.test(idOrSlug)) {
    const titleSlug = await searchTitleSlugByKeyword(idOrSlug + ".");
    if (titleSlug) {
      slug = titleSlug;
    }
    problem = await leetcode.problem(slug);
  } else {
    problem = await leetcode.problem(idOrSlug);
    if (!problem) {
      // try searching by keyword if direct fetch failed
      const titleSlug = await searchTitleSlugByKeyword(idOrSlug);
      if (titleSlug) {
        problem = await leetcode.problem(titleSlug);
      }
    }
  }

  if (problem && (idOrSlug == problem.questionFrontendId || idOrSlug == problem.titleSlug)) {
    // cache the problem under the provided input parameter forever
    await redis.setJson(cacheKey, problem);
  } else if (problem) {
    // cache successful searches for 1 hour
    await redis.setJson(cacheKey, problem, 60 * 60);
  } else {
    // cache failed searches for 5 minutes to prevent repeated API calls
    await redis.setJson(cacheKey, null, 60 * 5);
  }
  return problem;
};

export const searchTitleSlugByKeyword = async (keyword: string): Promise<string | null> => {
  const searchCacheKey = `leetcode:search:${keyword.toLowerCase()}`;
  const cachedResult = await redis.getJson<string | null>(searchCacheKey);
  if (cachedResult !== undefined) return cachedResult;

  const query = `
    query problemsetQuestionListV2($filters: QuestionFilterInput, $limit: Int, $searchKeyword: String, $skip: Int, $sortBy: QuestionSortByInput, $categorySlug: String) {
      problemsetQuestionListV2(
        filters: $filters
        limit: $limit
        searchKeyword: $searchKeyword
        skip: $skip
        sortBy: $sortBy
        categorySlug: $categorySlug
      ) {
        questions {
          titleSlug
        }
      }
    }
  `;

  const variables = {
    filters: {
      filterCombineType: "ALL",
      statusFilter: { questionStatuses: [], operator: "IS" },
      difficultyFilter: { difficulties: [], operator: "IS" },
      languageFilter: { languageSlugs: [], operator: "IS" },
      topicFilter: { topicSlugs: [], operator: "IS" },
      acceptanceFilter: {},
      frequencyFilter: {},
      frontendIdFilter: {},
      lastSubmittedFilter: {},
      publishedFilter: {},
      companyFilter: { companySlugs: [], operator: "IS" },
      positionFilter: { positionSlugs: [], operator: "IS" },
      contestPointFilter: { contestPoints: [], operator: "IS" },
      premiumFilter: { premiumStatus: [], operator: "IS" },
    },
    categorySlug: "all-code-essentials",
    searchKeyword: keyword,
    limit: 10,
    skip: 0,
  };

  const res: {
    data?: {
      problemsetQuestionListV2?: {
        questions?: Array<{ titleSlug?: string }>;
      };
    };
  } = await leetcode.graphql({ query, variables });
  console.log("Data", res.data);
  const questions = res.data?.problemsetQuestionListV2?.questions ?? [];
  const result = questions.length > 0 ? (questions[0].titleSlug ?? null) : null;

  // Failed searches are less useful but prevent spam, successful can stay but we still
  // don't want many of them hanging around for similar reasons... probably should use LRU
  // or something else instead
  await redis.setJson(searchCacheKey, result, result ? 60 * 30 : 60 * 5);

  return result;
};
