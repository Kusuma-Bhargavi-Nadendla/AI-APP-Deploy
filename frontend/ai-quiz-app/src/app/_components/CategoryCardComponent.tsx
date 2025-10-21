


import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useRouter } from "next/navigation";
import { ArrowRight, TrendingUp } from "lucide-react";

interface CategoryCardProps {
  categoryId?:string;
  categoryTitle: string;
  description?: string;
  trending?: boolean;
  color?: string;
}

export default function CategoryCardComponent({
  categoryId,
  categoryTitle,
  description,
  trending = false,
  color = "bg-gradient-to-br from-white to-gray-50",
}: CategoryCardProps) {
  const router = useRouter();

  const handleArrowClick = () => {
    const slug = categoryTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    localStorage.setItem('categoryId',JSON.stringify(categoryId));
    router.push(`/categories/${slug}`);
  };

  return (
    <Card className={`${color} min-h-[180px] flex flex-col justify-between border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group cursor-pointer`}>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-800 transition-colors">
            {categoryTitle}
          </h3>
          {trending && (
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm px-2 py-1 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-gray-600 leading-relaxed flex-1">
            {description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 flex justify-end">
        <Button 
          size="sm" 
          onClick={handleArrowClick}
          className="bg-blue-600 hover:bg-blue-900 text-white rounded-full w-10 h-10 p-0 group-hover:scale-110 transition-transform duration-300 shadow-md"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}