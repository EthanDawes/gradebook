# Gradebook

Browser extension to stay on top of your grades.

Download on the Chrome Web Store!

## Features
- Consolidate grades from Brightspace and Gradescope
- Track your current grade
  - What percentage of my final grade is one homework worth?
  - How well am I doing in the quizzes category?
- Estimate grades post-curve
  - What will be my grade if the average is curved to a B-?
- Run hypotheticals
  - What grade do I need on the final to get a B?
  - How will my grade be affected if I get 90% on all future homeworks?

## Developing

```bash
pnpm install
pnpm dev
```

## Issues
Does not save if current term not selected. This can happen when
- Creating the first course in a term (doesn't show up)
- Creating a new course (opens, but doesn't select)
