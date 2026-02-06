# Mobile Modal Positioning and Layout Optimization

This document outlines the solution for ensuring modals remain visible and functional on mobile devices, specifically addressing issues with fixed positioning and vertical space management.

## Fixed Positioning Bug: Animated Containers

### Problem
When a modal with `position: fixed` or `position: absolute` is placed inside a container that has CSS animations or transforms (e.g., `animate-fade-in`, `scale`, `translate`), the browser creates a new **stacking context**. This causes the modal to be positioned relative to the animated container instead of the viewport, often leading to:
- Layout "burial" where buttons are pushed beyond the reachable screen.
- Scroll issues where the modal doesn't stick to the top/bottom of the mobile viewport.

### Solution
**Always place the modal component outside of any animated or transformed parent containers.**

```jsx
// BEFORE (Broken on mobile)
return (
  <div className="animate-fade-in">
    <MainContent />
    {isEditing && <Modal />} // Modal inherits the transformation context
  </div>
);

// AFTER (Fixed)
return (
  <>
    <div className="animate-fade-in">
      <MainContent />
    </div>
    {isEditing && <Modal />} // Modal is a sibling, positions relative to viewport
  </>
);
```

## Compact Layout Patterns for Mobile

To prevent excessive scrolling (vertical fatigue) in mobile forms, follow these design principles:

### 1. Row-Based Selection Controls
Instead of vertical stacks for selection tags or skills, use a horizontal "Circle + Text" row layout within a grid.

```jsx
// Compact Skill Row
<div className="flex items-center gap-3">
    <div className="w-6 h-6 rounded-[10px] border-2 flex items-center justify-center shrink-0">
        {isSelected && <Check size={14} />}
    </div>
    <span className="text-xs font-bold uppercase trackling-wider">{skill}</span>
</div>
```

### 2. Header and Footer Minimization
- Reduce `padding` on modal headers and footers (e.g., from `p-8` to `p-4` or `p-3`).
- Use `shrink-0` on headers and footers to ensure they don't collapse, while allowing the form/body to be `flex-1 overflow-y-auto`.
- Use `pb-safe` to respect device notches and home bars.

### 3. Clear Visual Priority
- Add a subtle background color (e.g., `bg-gray-50`) or top-shadow to the fixed footer to clearly demarcate the action area (Save/Cancel) from the scrolling content.
- Ensure unselected states (like empty circles) have enough contrast (`gray-400` or higher) against the background.
