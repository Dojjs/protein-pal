import { useState, useEffect } from "react";
import { AddIngredientForm } from "@/components/AddIngredientForm";
import { IngredientCard } from "@/components/IngredientCard";
import { RecipeSummary } from "@/components/RecipeSummary";
import { PortionCalculator } from "@/components/PortionCalculator";
import { SavedRecipes } from "@/components/SavedRecipes";
import { RecipeDetail } from "@/components/RecipeDetail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface Ingredient {
  id: string;
  name: string;
  weight: number;
  protein: number;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  timestamp: number;
  cookedWeight?: number;
}

const STORAGE_KEY = "protein-calculator-recipes";

const Index = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeName, setRecipeName] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Recipe[];
        if (Array.isArray(parsed)) {
          setRecipes(parsed);
        }
      } catch (e) {
        console.warn("Could not parse stored recipes:", e);
        // If parse fails, clear corrupted storage to avoid repeated errors:
        // localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveRecipes = (updatedRecipes: Recipe[]) => {
    setRecipes(updatedRecipes);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecipes));
    } catch (e) {
      console.warn("Failed to save recipes to localStorage:", e);
      toast.error("Could not save recipes to storage");
    }
  };

  const handleAddIngredient = (ingredient: { name: string; weight: number; protein: number }) => {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };
    setIngredients((prev) => [...prev, newIngredient]);
    toast.success("Ingredient added");
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    toast.success("Ingredient removed");
  };

  const handleClearAll = () => {
    setIngredients([]);
    toast.success("All ingredients cleared");
  };

  const handleSaveRecipe = () => {
    if (!recipeName.trim()) {
      toast.error("Please enter a recipe name");
      return;
    }
    if (ingredients.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }

    // Clone ingredients so saved recipe keeps its own copy
    const clonedIngredients = ingredients.map((i) => ({ ...i }));

    const newRecipe: Recipe = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: recipeName.trim(),
      ingredients: clonedIngredients,
      timestamp: Date.now(),
    };

    saveRecipes([...recipes, newRecipe]);
    setIngredients([]);
    setRecipeName("");
    toast.success("Recipe saved!");
  };

  const handleDeleteRecipe = (id: string) => {
    saveRecipes(recipes.filter((r) => r.id !== id));
    // If we were viewing this recipe, close the detail view
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }
    toast.success("Recipe deleted");
  };

  const handleUpdateRecipe = (updatedRecipe: Recipe) => {
    saveRecipes(recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
    // Keep the detail view in sync if the user is editing a recipe
    if (selectedRecipe?.id === updatedRecipe.id) {
      setSelectedRecipe(updatedRecipe);
      toast.success("Recipe updated");
    }
  };

  const totalWeight = ingredients.reduce((sum, ing) => sum + Number(ing.weight || 0), 0);
  const totalProtein = ingredients.reduce((sum, ing) => sum + Number(ing.protein || 0), 0);
  const proteinPercentage = totalWeight > 0 ? (totalProtein / totalWeight) * 100 : 0;

  if (selectedRecipe) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <RecipeDetail
            recipe={selectedRecipe}
            onBack={() => setSelectedRecipe(null)}
            onSave={handleUpdateRecipe}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Protein Calculator</h1>
          <p className="text-muted-foreground">Track protein content in your recipes and portions</p>
        </header>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Recipe</TabsTrigger>
            <TabsTrigger value="saved">My Recipes ({recipes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-8">
            <AddIngredientForm onAdd={handleAddIngredient} />

            {ingredients.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    Ingredients ({ingredients.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>

                <div className="space-y-3">
                  {ingredients.map((ingredient) => (
                    <IngredientCard
                      key={ingredient.id}
                      name={ingredient.name}
                      weight={ingredient.weight}
                      protein={ingredient.protein}
                      onRemove={() => handleRemoveIngredient(ingredient.id)}
                    />
                  ))}
                </div>

                <RecipeSummary
                  totalWeight={totalWeight}
                  totalProtein={totalProtein}
                  proteinPercentage={proteinPercentage}
                />

                <PortionCalculator totalWeight={totalWeight} totalProtein={totalProtein} />

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="recipe-name">Recipe Name</Label>
                    <Input
                      id="recipe-name"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      placeholder="Enter recipe name"
                    />
                  </div>
                  <Button onClick={handleSaveRecipe} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Recipe
                  </Button>
                </div>
              </>
            )}

            {ingredients.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Add your first ingredient to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <SavedRecipes recipes={recipes} onSelect={setSelectedRecipe} onDelete={handleDeleteRecipe} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;