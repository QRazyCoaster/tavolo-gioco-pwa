
// Category constants matching your database
export const CATEGORIES = [
  'geo_his',
  'show_biz', 
  'riddles',
  'sports',
  'tech_sci',
  'drinks',
  'math'
] as const;

export type QuestionCategory = typeof CATEGORIES[number];

// Validate if a category is valid
export const isValidCategory = (category: string): category is QuestionCategory => {
  return CATEGORIES.includes(category as QuestionCategory);
};

// Get all categories
export const getAllCategories = (): QuestionCategory[] => {
  return [...CATEGORIES];
};
