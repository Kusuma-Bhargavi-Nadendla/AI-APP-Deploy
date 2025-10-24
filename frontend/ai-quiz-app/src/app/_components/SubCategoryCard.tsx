

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { TrendingUp, Sparkles, ArrowRight, Users } from "lucide-react";

interface SubcategoryCardProps {
  subcategoryTitle: string;
  subcategoryDescription: string;
  usersTaken?: number;
  trending?: boolean;
  isNew?: boolean;
  color?: string;
  onStartTest: () => void;
}

export default function SubcategoryCard({
  subcategoryTitle,
  subcategoryDescription,
  usersTaken,
  trending = false,
  isNew = false,
  color = "bg-white",
  onStartTest,
}: SubcategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartTest();
  };

  return (
    <Card className="border-0 shadow-sm  cursor-pointer overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div 
            className={`${color} transition-all duration-500 ease-in-out ${
              isExpanded 
                ? 'w-4/5 pl-8 pr-6 py-6'  
                : 'w-full px-8 py-6'  
            }`}
            onClick={handleCardClick}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex gap-2">
                {trending && (
                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1.5">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {isNew && (
                  <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5">
                    <Sparkles className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                )}
              </div>

              <h3 className="text-xl font-semibold text-slate-900 flex-1">
                {subcategoryTitle}
              </h3>
            </div>

            {usersTaken !== undefined && (
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <Users className="h-4 w-4" />
                <span>{usersTaken.toLocaleString()} learners took this test</span>
              </div>
            )}

            <div className={`overflow-hidden transition-all duration-500 ${
              isExpanded 
                ? 'mt-4 pt-4 border-t border-slate-100 max-h-20 opacity-100' 
                : 'max-h-0 opacity-0'
            }`}>
              <p className="text-slate-700 leading-relaxed text-sm">
                {subcategoryDescription}
              </p>
            </div>
          </div>

          <div 
            className={`flex items-center justify-center transition-all duration-500 ease-out ${
              isExpanded 
                ? 'w-1/5 opacity-100' 
                : 'w-0 opacity-0' 
            }`}
            onClick={handleStartTest}
          >
            <div className={`p-4 rounded-full transition-all duration-300 hover:scale-110 hover:bg-blue-50 ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            }`}>
              <ArrowRight className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




