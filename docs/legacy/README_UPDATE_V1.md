# Prototype V2 Update

Replace these files in the GitHub repository:

- index.html
- js/app.js
- js/data.js
- js/line.js (new)
- js/member.js (new)
- css/line.css (new)
- css/member.css

## Changes

1. Dashboard:
   - Add Line button.
   - Click a Line to show the top 5 available members by highest skill.
   - Selected Line is visually highlighted.
   - Edit and Hapus buttons are available for each Line.
2. Member:
   - Edit button added.
   - Edit modal can update No Reg, name, status, photo, and current skill level.
3. Skill:
   - Current prototype supports the operations already present in the seed data.
   - Skill values: 0, 0.1, 0.2, 1.
4. New Line:
   - A new line is not given fake operations automatically.
   - Ranking displays a clear message until operations and skill data exist.
5. Data:
   - Existing localStorage data is preserved; no automatic reset.

## Important
This is still the JSON/localStorage prototype. Supabase integration should be done after this interaction flow is approved.

