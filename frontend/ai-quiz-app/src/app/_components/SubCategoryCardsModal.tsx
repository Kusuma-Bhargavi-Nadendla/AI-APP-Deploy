import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import SubcategoryCard from "./SubCategoryCard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SubcategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryTitle: string;
}

interface Subcategory {
    id: string;
    name: string;
    usersTaken?: number;
    trending?: boolean;
    isNew?: boolean;
    color?: string;
}

export default function SubcategoryModal({
    isOpen,
    onClose,
    categoryTitle,
}: SubcategoryModalProps) {
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            fetchSubcategories();
        }
    }, [isOpen, categoryTitle]);

    const fetchSubcategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // const response = await fetch(`http://localhost:5000/categories/${categoryTitle}/subcategories`);
            // if (!response.ok) {
            //     throw new Error(`Failed to fetch subcategories: ${response.status}`);
            // }
            // const data = await response.json();
            const fakeSubcategories = [
                {
                    "id": "1",
                    "name": "Frontend Development",
                    "usersTaken": 12500,
                    "trending": true,
                    "isNew": false,
                    "color": "bg-blue-50"
                },
                {
                    "id": "2",
                    "name": "Backend Development",
                    "usersTaken": 9800,
                    "trending": true,
                    "isNew": false,
                    "color": "bg-green-50"
                },
                {
                    "id": "3",
                    "name": "Artificial Intelligence",
                    "usersTaken": 15600,
                    "trending": true,
                    "isNew": true,
                    "color": "bg-purple-50"
                },
                {
                    "id": "4",
                    "name": "Cybersecurity",
                    "usersTaken": 8200,
                    "trending": false,
                    "isNew": false,
                    "color": "bg-red-50"
                },
                {
                    "id": "5",
                    "name": "Cloud Computing",
                    "usersTaken": 11200,
                    "trending": true,
                    "isNew": false,
                    "color": "bg-orange-50"
                },
                {
                    "id": "6",
                    "name": "Data Science",
                    "usersTaken": 13400,
                    "trending": true,
                    "isNew": false,
                    "color": "bg-teal-50"
                },
                {
                    "id": "7",
                    "name": "Mobile Development",
                    "usersTaken": 7600,
                    "trending": false,
                    "isNew": false,
                    "color": "bg-indigo-50"
                },
                {
                    "id": "8",
                    "name": "DevOps",
                    "usersTaken": 8900,
                    "trending": true,
                    "isNew": false,
                    "color": "bg-yellow-50"
                },
                {
                    "id": "9",
                    "name": "Blockchain & Web3",
                    "usersTaken": 5400,
                    "trending": true,
                    "isNew": true,
                    "color": "bg-gray-50"
                },
                {
                    "id": "10",
                    "name": "Quantum Computing",
                    "usersTaken": 2100,
                    "trending": false,
                    "isNew": true,
                    "color": "bg-pink-50"
                }
            ];
            const data = fakeSubcategories;
            setSubcategories(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load subcategories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        fetchSubcategories();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">
                        {categoryTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading subcategories...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">{error}</p>
                            <Button onClick={handleRetry} variant="outline">
                                Retry
                            </Button>
                        </div>
                    ) : subcategories.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {
                            // subcategories.map((subcategory) => (
                            //     <SubcategoryCard
                            //         key={subcategory.id}
                            //         subcategoryTitle={subcategory.name}
                            //         usersTaken={subcategory.usersTaken}
                            //         trending={subcategory.trending}
                            //         isNew={subcategory.isNew}
                            //         color={subcategory.color || "bg-white"}
                            //         onStartTest={(specificTopic) => {
                            //             console.log("Starting test for:", subcategory.name);
                            //             console.log("Specific topic:", specificTopic);
                            //             router.push(`/quiz?subcategory=${subcategory.name}&topic=${specificTopic}`);
                            //         }}
                            //     />
                            // ))
                            }
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-600">No subcategories found</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}