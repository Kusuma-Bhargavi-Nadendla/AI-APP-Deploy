import { AIService } from "./aiService"
export class CategoryService {
  private categoryCache = new Map<string, string>(); 


  async getCategories(existingCategories: string[] = []) {
    console.log("get categories service invoked");
    const cacheEntries = Array.from(this.categoryCache.entries());
    
    const aiCategories = await AIService.generateCategoriesWithCache(
      existingCategories, 
      cacheEntries
    );
    console.log(" aiCategories type:", typeof aiCategories);
      console.log("aiCategories value:", aiCategories);
      console.log(" Is array?", Array.isArray(aiCategories));

      if (!aiCategories) {
        console.warn(" aiCategories is null or undefined");
        return [];
      }
    
    const response = aiCategories.map(cat => {
      if (cat.cachedId) {
        return { ...cat, id: cat.cachedId };
      } else {
        const newId = this.generateId();
        this.categoryCache.set(newId, cat.name);
        return { ...cat, id: newId };
      }
      
    });
    console.log("Final categories response:", response, cacheEntries);
    return response;
  }

  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}