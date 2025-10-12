import { LeetCode } from "leetcode-query";

// implement caching or storage of questions later

const leetcode = new LeetCode();

export const getDailyProblem = async () => {
  const dailyProblem = await leetcode.daily();
  return dailyProblem;
};

export const getProblemByIdOrSlug = async (idOrSlug: string) => {
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
  return problem;
};

/**
 * Search LeetCode by keyword and return the first question's titleSlug.
 * Uses the `problemsetQuestionListV2` GraphQL query but only requests the
 * `titleSlug` field from the results.
 */
export const searchTitleSlugByKeyword = async (keyword: string): Promise<string | null> => {
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
  return questions.length > 0 ? (questions[0].titleSlug ?? null) : null;
};
