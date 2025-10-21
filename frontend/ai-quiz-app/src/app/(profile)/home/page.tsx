
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CategoryCardComponent from "../../_components/CategoryCardComponent";
import { MagicSearchLoader } from "@/app/_lib/MagicSearchLoader";
import { getRandomColor } from "../../_lib/utils";
interface CategoryCardProps {
  categoryTitle: string;
  description?: string;
  trending?: boolean;
  color?: string;
  id?: string;
  onArrowClick: () => void;
}

export default function Home() {
  const [categories, setCategories] = useState<CategoryCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [cacheInfo, setCacheInfo] = useState<{
    cached: boolean;
    age?: string;
  }>({ cached: false });

  const loadCategories = async (refresh = false, page = 1) => {
    console.log("Loading categories...");
    const categoriesTitles = categories.map((item) => item.categoryTitle);
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/categories", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoriesTitles, refresh, page }),
      cache: "no-store",
    });
    if (res.status === 401) {
      console.log("Token expired or invalid. Redirecting to login.");
      router.push("/");
      return;
    }
    console.log("cmg here");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const result = await res.json();
    // const data = await result.response;

    setCacheInfo({
      cached: result.cached || false,
      age: result.age
    });


    const data = result.data;
    console.log("Fetched categories data:", result, data, typeof data, Array.isArray(data));
    const mappedCategories = [...data].map((item: any) => ({
      categoryId: item.id,
      categoryTitle: item.name || item.category || "Unknown Category",
      description: item.description,
      trending: item.trending || false,
      color: getRandomColor() || "bg-white",
      onArrowClick: () => console.log(`Clicked ${item.name}`),
    }));
    if (page === 1) {
      setCategories(mappedCategories);
    } else {
      setCategories((prev) => [...prev, ...mappedCategories]);
    }
    setPage(page + 1);
  };

  const loadMoreCategories = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await loadCategories(true, page);
    } catch (error) {
      console.log("Failed to load more categories:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSearch = async (query: string) => {
    const token = localStorage.getItem("token");
    if (query.length >= 1) {

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSearching(true);
          const res = await fetch("http://localhost:5000/categories/Search", {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search: query }),
          });

          if (res.ok) {
            const result = await res.json();
            // const searchData = await result.response;
            const searchData = result.data;
            console.log("Search results:", searchData.length, searchData)
            const mappedSearchResults = searchData.map((item: any) => ({
              categoryId: item.id,
              categoryTitle: item.name || item.category || "Unknown Category",
              description: item.description,
              trending: item.trending || false,
              color: getRandomColor() || "bg-white",
              onArrowClick: () => console.log(`Clicked ${item.name}`),
            }));
            setCategories(mappedSearchResults);
          }
        } catch (error) {
          console.log("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      }, 1000);
    } else if (query.length === 0) {
      setCategories([]);
      setIsLoading(true);
      await loadCategories();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await loadCategories();
      } catch (error) {
        console.log("Failed to fetch categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && searchQuery.length === 0) {
          loadMoreCategories();
        }
      },
      { threshold: 1.0 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isLoading, loadCategories]);

  const displayedCategories = searchQuery.length > 0 && searchQuery.length < 3
    ? categories.filter(cat =>
      cat.categoryTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : categories;

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadCategories(true);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col">

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top 0 z-10">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Explore Categories
              </h1>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      {cacheInfo.cached && (!isSearching && searchQuery.length == 0) && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800">
          <div className="flex items-center justify-center gap-2">
            <span>These categories were generated {cacheInfo.age}</span>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="underline hover:no-underline disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Get fresh results'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="px-4 py-6">
          {(isLoading || isSearching) ? (
            <div className="text-center py-8">
              <MagicSearchLoader />

            </div>
          ) : displayedCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">


              {displayedCategories.map((category, index) => (
                <CategoryCardComponent key={index} {...category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? `No results for "${searchQuery}"` : "No categories available"}
              </h3>
              <p className="text-gray-600">
                {searchQuery ? "Try a different search term" : "There was an issue loading categories"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCategories([]);
                    setIsLoading(true);
                    loadCategories().finally(() => setIsLoading(false));
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {searchQuery === "" && (
            <div ref={sentinelRef} className="h-10">
              {isLoadingMore && (
                <div className="text-center py-8">
                  <MagicSearchLoader />

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}