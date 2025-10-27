import { LeetCode } from "leetcode-query";
import type { Problem } from "leetcode-query";
import { redis } from "../lib/redis-client.js";

const leetcode = new LeetCode();

export const getDailyProblem = async () => {
  const todayUTC = new Date().toISOString().slice(0, 10);
  const todayKey = `leetcode:daily:${todayUTC}`;
  const cachedId = await redis.get<string>(todayKey);
  if (cachedId) return getProblemByQuery(cachedId);
  console.debug(`Daily for ${todayUTC} not cached, fetching...`);

  const dailyProblem = await leetcode.daily();
  if (!dailyProblem || dailyProblem.date !== todayUTC) return null;
  console.debug(`Daily fetched successfully`);

  await redis.set(todayKey, dailyProblem.question.titleSlug);
  // this will technically fetch the problem twice the first, but it's not really a big deal
  return getProblemByQuery(dailyProblem.question.titleSlug);
};

export const getProblemByQuery = async (idOrSlug: string) => {
  // if it's a URL grab the slug
  const parsedSlug = parseSlugFromURL(idOrSlug);
  if (parsedSlug) idOrSlug = parsedSlug;
  const cacheKey = `leetcode:problem:${idOrSlug}`;
  const cached = await redis.getJson<Problem>(cacheKey);
  if (cached) return cached;

  let slug = idOrSlug;
  let problem = null;
  const isNumericQuery = /^\d+$/.test(idOrSlug);
  // there's no direct call for frontend id
  if (isNumericQuery) {
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

  if (problem) {
    const isExactMatch = idOrSlug == problem.questionFrontendId || idOrSlug == problem.titleSlug;
    const ttl = isExactMatch ? undefined : 60 * 60;

    // always cache by the original query
    await redis.setJson(cacheKey, problem, ttl);

    // also cache by the other identifier
    if (isNumericQuery && problem.titleSlug && problem.titleSlug !== idOrSlug) {
      // searched by ID, also cache by slug
      await redis.setJson(`leetcode:problem:${problem.titleSlug}`, problem, ttl);
    } else if (!isNumericQuery && problem.questionFrontendId && problem.questionFrontendId !== idOrSlug) {
      // searched by slug, also cache by frontend ID
      await redis.setJson(`leetcode:problem:${problem.questionFrontendId}`, problem, ttl);
    }
  } else {
    // cache failed searches for 5 minutes to prevent repeated API calls
    await redis.setJson(cacheKey, null, 60 * 5);
  }
  return problem;
};

export const searchTitleSlugByKeyword = async (keyword: string): Promise<string | null> => {
  const searchCacheKey = `leetcode:search:${keyword.toLowerCase()}`;
  const exists = await redis.exists(searchCacheKey);
  if (exists) {
    return await redis.getJson<string | null>(searchCacheKey);
  }

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
  const questions = res.data?.problemsetQuestionListV2?.questions ?? [];
  const result = questions.length > 0 ? (questions[0].titleSlug ?? null) : null;

  // Failed searches are less useful but prevent spam, successful can stay but we still
  // don't want many of them hanging around for similar reasons... probably should use LRU
  // or something else instead
  await redis.setJson(searchCacheKey, result, result ? 60 * 30 : 60 * 5);

  return result;
};

export const parseSlugFromURL = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);

    // Check if it's a valid LeetCode problems URL
    if (pathSegments[0] === "problems" && pathSegments[1]) {
      return pathSegments[1];
    }

    return null;
  } catch {
    return null;
  }
};
