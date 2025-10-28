/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, use, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { Button } from "../../../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import SubcategoryCard from "../../../_components/SubCategoryCard";
import { useRouter } from "next/navigation";
import { MagicSearchLoader } from "@/app/_lib/MagicSearchLoader";
import { getCachedSubcategories, setCachedSubcategories } from "../../../../lib/subCategoryCache";
import { getRandomColor } from "../../../_lib/utils";
import { setCachedResults, getCachedSearchSubcategories } from "../../../../lib/searchCache"
import { appDB } from "../../../../lib/appDataDB";
import type {Subcategory, QuizLandingData,CacheInfo} from "../../../../lib/types"
import type { PageProps} from "../../../../lib/types"

function normalizeCategoryTitle(title: string): string {
  return title.trim().toLowerCase();
}

async function fetchSubcategories(
  categoryTitle: string,
  existingSubcategories: string[] = [],
  refresh = false
): Promise<{ subcategories: Subcategory[], cacheInfo: CacheInfo }> {
  const normalizedTitle = normalizeCategoryTitle(categoryTitle);
  if (!normalizedTitle) {
    throw new Error("Invalid category title");
  }

  if (!refresh) {
    const cached = await getCachedSubcategories(normalizedTitle);
    if (cached?.subcategories.length) {
      console.log(`Cache hit for subcategories of "${categoryTitle}"`);
      const cacheSubcategories = cached.subcategories.map((sub, index) => ({
        ...sub,
        id: sub.id || `cached-${index}-${Date.now()}`,
        color: getRandomColor() || "bg-white",
      }));
      return {
        subcategories: cacheSubcategories,
        cacheInfo: { cached: true, age: cached.age }
      };
    }
  }

  const token = localStorage.getItem('token');
  const res = await fetch("http://localhost:5000/categories/subcategories", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category: categoryTitle,
      existingSubcategories,
      refresh,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch subcategories");
  }

  const result = await res.json();
  const data = result.data;

  const subcategories: Subcategory[] = data.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    usersTaken: item.usersTaken,
    trending: item.trending,
    isNew: item.isNew,
    color: getRandomColor() || "bg-white",
  }));

  await setCachedSubcategories(normalizedTitle, subcategories);

  return {
    subcategories,
    cacheInfo: {
      cached: result.cached || false,
      age: result.age
    }
  };
}

export default function CategoryClient({ params }: PageProps) {
  const resolvedParams = use(params);
  // const categoryTitle = resolvedParams.category;
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({ cached: false });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [categoryTitle,setCategoryTitle]= useState("");
  const [categoryDescription,setCategoryDescription]=useState("");

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const handleSearch = async (query: string) => {
    if (query.length >= 1) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      const cachedCategories = await getCachedSearchSubcategories(query);
      if (cachedCategories && cachedCategories.length > 0) {
        console.log("Cache hit (categories only) for:", query);

        const mappedFromCache = cachedCategories.map(item => ({
          id: "",
          name: item.title,
          description: item.description,
          usersTaken: item.usersTaken,
          isNew: item.isNew,
          trending: item.isTrending,
          color: getRandomColor() || 'bg-white',
        }));

        setSubcategories(mappedFromCache);
        return;
      }

      setIsLoading(true);
      const currentQuery = query;

      searchTimeoutRef.current = setTimeout(async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(
            "http://localhost:5000/categories/subcategories/search",
            {
              method: "POST",
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ categoryTitle, query }),
            }
          );

          if (res.ok) {
            const result = await res.json();
            const searchData = result.data;

            const mappedSearchResults = searchData.map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              usersTaken: item.usersTaken,
              trending: item.trending,
              isNew: item.isNew,
              color: getRandomColor() || 'bg-white',
            }));
            console.log("2 queries",searchQuery, currentQuery);
            // if (searchQuery === currentQuery) {
            setSubcategories(mappedSearchResults);
            // } else if (searchQuery.length === 0) {
            //   loadInitialSubcategories();
            // } else {
            //   // keep waiting
            // }

            const cacheResults = mappedSearchResults.map((item: any) => ({
              type: 'subcategory',
              categoryId: item.id ?? "",
              title: item.name,
              description: item.description,
              isTrending: item.trending,
              isNew: item.isNew,
              usersTaken: item.usersTaken,
            }));
            await setCachedResults(query, cacheResults);

            console.log("setting cache for ", query);
            setCacheInfo({ cached: false });
          }
        } catch (error) {
          console.log("Search failed:", error);
          setError("Search failed. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }, 500);
    } else if (query.length === 0) {
      setSearchQuery("");
      setIsLoading(true);
      try {
        const { subcategories: data, cacheInfo: info } = await fetchSubcategories(categoryTitle);
        setSubcategories(data);
        setCacheInfo(info);
        setHasMore(data.length > 0);
      } catch (err) {
        setError("Failed to load subcategories");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadInitialSubcategories = async (refresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const { subcategories: data, cacheInfo: info } = await fetchSubcategories(categoryTitle, [], refresh);
      setSubcategories(data);
      setCacheInfo(info);
      setHasMore(data.length > 0);
    } catch (err) {
      setError("Failed to load subcategories");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreSubCategories = async () => {
    if (isLoadingMore || !hasMore || searchQuery.length > 0) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const existingNames = subcategories.map((sub) => sub.name);
      const { subcategories: newCategories } = await fetchSubcategories(categoryTitle, existingNames, true);

      if (newCategories.length === 0) {
        setHasMore(false);
      } else {
        setSubcategories((prev) => [...prev, ...newCategories]);
      }
    } catch (err) {
      setError("Failed to load more categories");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    console.log("load2");
    await loadInitialSubcategories(true);
  };

  const loadCategoryDetails = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      const data = await appDB.getCurrentCategoryDetails(sessionId);
      setCategoryTitle(data.category);
      setCategoryDescription(data.categoryDescription);
      console.log("got this data from indexdb:",data);
    } else {
      console.log("Session ID not found from LS")
    }

  }

  useEffect(() => {
    console.log("load 1", categoryTitle)
    loadInitialSubcategories();
    loadCategoryDetails();
  }, [categoryTitle]);

  useEffect(() => {
    if (isLoading || isLoadingMore || searchQuery.length > 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          searchQuery.length === 0 &&
          hasMore
        ) {
          loadMoreSubCategories()
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isLoading, isLoadingMore, hasMore, searchQuery, loadMoreSubCategories]);

  const categoryId = localStorage.getItem('categoryId') ?? "";
  // const decodedCategoryTitle = decodeURIComponent(categoryTitle).replace(/-/g, " ");

  const handleStartTest = async (subcategory: Subcategory) => {
    console.log("Starting test for:", subcategory.name);
    const quizData: QuizLandingData = {
      categoryId,
      categoryTitle: categoryTitle,
      subcategoryTitle: subcategory.name,
      description: `Test your knowledge in ${subcategory.description} with this comprehensive quiz.`,
      questionsCount: 3,
    };

    const quizId = `quiz_${Date.now()}`;
    // localStorage.setItem('quizId', quizId);
    // localStorage.setItem(quizId, JSON.stringify(quizData));

    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      await appDB.updateSession(sessionId, {
        subcategory: subcategory.name,
        quizSlugId: quizId,
        subcategoryDescription:subcategory.description
      });
    } else {
      console.warn("sessionid not found");
    }

    router.push(`/quiz/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/4">
            <div className="sticky top-8 space-y-8">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 pl-0 hover:bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </Button>

              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2 capitalize">
                    {categoryTitle}
                  </h1>
                  <div className="w-16 h-1 bg-blue-500 rounded-full"></div>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {categoryDescription}
                  </p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Click on any subcategory to learn more and begin your
                    assessment journey.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-3/4">


            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search subcategories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {cacheInfo.cached && !isLoading && searchQuery.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    <span>These subcategories were generated {cacheInfo.age}</span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 underline text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Refreshing...' : 'Get fresh results'}
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-h-[calc(100vh-12rem)] pt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex items-center gap-3 text-slate-600">
                    <MagicSearchLoader />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl">
                  {subcategories.map((subcategory, index) => (
                    <SubcategoryCard
                      key={subcategory.id || index}
                      subcategoryTitle={subcategory.name}
                      subcategoryDescription={subcategory.description}
                      usersTaken={subcategory.usersTaken}
                      trending={subcategory.trending}
                      isNew={subcategory.isNew}
                      color={subcategory.color || "bg-white"}
                      onStartTest={() => handleStartTest(subcategory)}
                    />
                  ))}
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                      Try Again
                    </Button>
                  </div>
                </div>
              )}


              {!hasMore && subcategories.length > 0 && searchQuery.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      All Paths Explored
                    </h3>
                    <p className="text-slate-600 text-sm">
                      You&apos;ve discovered all available learning paths
                    </p>
                  </div>
                </div>
              )}
              {searchQuery === "" ? (
                <div ref={sentinelRef} className="h-10">
                  {isLoading ? (
                    <></>
                  ) : (
                    <div className="text-center py-8">
                      <MagicSearchLoader />
                    </div>
                  )}
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}