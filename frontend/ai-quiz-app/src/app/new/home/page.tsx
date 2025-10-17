// import HomePage from "../../(profile)/home/page"

// export default function Page(){
//     return(
//         <HomePage/>
//     )
// }



"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CategoryCardComponent from "../../_components/CategoryCardComponent";
import { MagicSearchLoader } from "@/app/_lib/MagicSearchLoader";

interface CategoryCardProps {
  categoryTitle: string;
  description?: string;
  trending?: boolean;
  color?: string;
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

  const loadCategories = async () => {
    const categoriesTitles = categories.map((item) => item.categoryTitle);
    const res = await fetch("http://localhost:5000/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoriesTitles }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const result = await res.json();
    const data = await result.response;
    const mappedCategories = [...data].map((item: any) => ({
      categoryTitle: item.name || item.category || "Unknown Category",
      description: item.description,
      trending: item.trending || false,
      color: item.color || "bg-white",
      onArrowClick: () => console.log(`Clicked ${item.name}`),
    }));
    setCategories((prev) => [...prev, ...mappedCategories]);
  };

  const loadMoreCategories = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await loadCategories();
    } catch (error) {
      console.log("Failed to load more categories:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length >= 1) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSearching(true);
          const res = await fetch("http://localhost:5000/categoriesBySearch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ search: query }),
          });

          if (res.ok) {
            const result = await res.json();
            const searchData = await result.response;
            const mappedSearchResults = searchData.map((item: any) => ({
              categoryTitle: item.name || item.category || "Unknown Category",
              description: item.description,
              trending: item.trending || false,
              color: item.color || "bg-white",
              onArrowClick: () => console.log(`Clicked ${item.name}`),
            }));
            setCategories(mappedSearchResults);
          }
        } catch (error) {
          console.log("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      }, 500);
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
  }, [router]);

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

  return (
    <div className="h-full flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

      <div className="flex-1 overflow-auto">
        <div className="px-4 py-6">
          {(isLoading || isSearching) ? (
            <div className="text-center py-8">
                <MagicSearchLoader/>
              {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading categories...</p> */}
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
                    <MagicSearchLoader/>
                  {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <div className="w-8 h-8 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-gray-600">Unlocking more knowledge...</p> */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}