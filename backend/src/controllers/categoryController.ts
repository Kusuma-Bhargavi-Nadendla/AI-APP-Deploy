import { Request, Response } from 'express';
import { CategoryService } from "../services/categoryService"
import { AIService } from "../services/aiService"
import { globalCache } from "../services/cacheService";
const categoryService = new CategoryService();
const CACHE_KEY = 'categories';
export const categoryController = {

    // async getCategories(req: Request, res: Response) {
    //     console.log("get categories controller invoked");
    //     try {
    //         const { categoriesTitles = [] } = req.body;

    //         const categories = await categoryService.getCategories(categoriesTitles);
    //         console.log("get categories controller response:", categories);

    //         res.json({
    //             success: true,
    //             data: categories,
    //             count: categories.length
    //         });
    //     } catch (error: any) {
    //         console.error('Get categories error:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'Failed to fetch categories'
    //         });
    //     }
    // },


    async getCategories(req: Request, res: Response) {
        try {
            const { categoriesTitles = [], refresh = false, page = 1 } = req.body;

            if (!refresh) {
                // const cached = globalCache.get(CACHE_KEY,page);
                const cached = globalCache.getPage(CACHE_KEY,page);
                if (cached) {
                    // const cacheInfo = globalCache.getCacheInfo(CACHE_KEY);
                    const cacheInfo = globalCache.getPageCacheInfo(CACHE_KEY,page);
                    return res.json({
                        success: true,
                        data: cached.data,
                        cached: true,
                        ...cacheInfo
                    });
                }
            }

            const startTime = Date.now();
            const categories = await categoryService.getCategories(categoriesTitles);
            const latency = Date.now() - startTime;

            // globalCache.set(CACHE_KEY, categories, page);
            globalCache.setPage(CACHE_KEY, categories, page);

            res.json({
                success: true,
                data: categories,
                cached: false,
                latency: `${latency}ms`,
                generatedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error(' Get categories error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch categories'
            });
        }
    },
    async searchCategories(req: Request, res: Response) {
        try {
            const { search, categoriesTitles = [] } = req.body;

            if (!search || typeof search !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const filteredCategories = await AIService.generateCategoriesBySearch(search, categoriesTitles);
            console.log("get categories controller response:", filteredCategories);
            res.json({
                success: true,
                data: filteredCategories,
                count: filteredCategories.length
            });
        } catch (error: any) {
            console.error('Search categories error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search categories'
            });
        }
    },

    async getSubcategories(req: Request, res: Response) {
        try {
            const { category, existingSubcategories = [] } = req.body;

            if (!category) {
                return res.status(400).json({
                    success: false,
                    error: 'Category is required'
                });
            }

            const subcategories = await AIService.generateSubcategories(category, existingSubcategories);

            res.json({
                success: true,
                data: subcategories,
                count: subcategories.length
            });
        } catch (error: any) {
            console.error('Get subcategories error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch subcategories'
            });
        }
    },

    async searchSubcategories(req: Request, res: Response) {
        try {
            const { categoryTitle, query, existingSubcategories = [] } = req.body;

            if (!categoryTitle || !query) {
                return res.status(400).json({
                    success: false,
                    error: 'Category title and search query are required'
                });
            }

            const subcategories = await AIService.generateSubcategoriesBySearch(
                categoryTitle,
                query,
                existingSubcategories
            );

            res.json({
                success: true,
                data: subcategories,
                count: subcategories.length
            });
        } catch (error: any) {
            console.error('Search subcategories error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search subcategories'
            });
        }
    }
};