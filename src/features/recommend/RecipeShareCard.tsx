import { forwardRef } from 'react';
import type { AIGeneratedRecipe } from './types';
import { getDifficultyLabel } from './utils';

interface RecipeShareCardProps {
  recipe: AIGeneratedRecipe;
  locale: string;
}

/**
 * 공유용 레시피 카드 (이미지 캡처 대상)
 * 화면에 보이지 않게 렌더링 후 html-to-image로 캡처
 */
export const RecipeShareCard = forwardRef<HTMLDivElement, RecipeShareCardProps>(
  ({ recipe, locale }, ref) => (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '375px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#ffffff',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>🍳</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '9999px' }}>
          AI Recipe
        </span>
      </div>

      {/* Title */}
      <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: '#111827', lineHeight: 1.3 }}>
        {recipe.title}
      </h2>
      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0', lineHeight: 1.4 }}>
        {recipe.description}
      </p>

      {/* Meta */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '9999px' }}>
          ⏱ {recipe.cookingTime}min
        </span>
        <span style={{ fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '9999px' }}>
          {getDifficultyLabel(recipe.difficulty, locale)}
        </span>
        <span style={{ fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '9999px' }}>
          {recipe.servings}인분
        </span>
      </div>

      {/* Ingredients */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0', color: '#111827' }}>재료</h3>
        {recipe.ingredients.map((ing, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 10px',
              backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#ffffff',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <span style={{ color: '#374151' }}>{ing.name}</span>
            <span style={{ color: '#9ca3af' }}>{ing.quantity}</span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0', color: '#111827' }}>만드는 법</h3>
        {recipe.instructions.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', lineHeight: 1.5 }}>
            <span style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
              {idx + 1}
            </span>
            <span style={{ color: '#374151' }}>{step.replace(/^\d+\.\s*/, '')}</span>
          </div>
        ))}
      </div>

      {/* Tips */}
      {recipe.tips && (
        <div style={{ backgroundColor: '#ecfdf5', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', color: '#065f46', margin: 0, lineHeight: 1.4 }}>
            💡 {recipe.tips}
          </p>
        </div>
      )}

      {/* Footer / Branding */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>🥬 밀키퍼 MealKeeper</span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>AI가 생성한 레시피입니다</span>
      </div>
    </div>
  )
);

RecipeShareCard.displayName = 'RecipeShareCard';
