export interface ValidationResult {
  isMatch: boolean;
  reason?: string;
  method?: 'ast' | 'simplify' | 'sampling';
}
