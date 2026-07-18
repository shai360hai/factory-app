# פקטורי — ניהול מועדון (גרסת בסיס)

מערכת דומה למה שראית ב-`factory-xi-orpin.vercel.app`: ניהול מסיבות, הכנסות,
הוצאות, סחורה, מחירי כניסה, דשבורד חודשי והתחשבנות.

**סטאק**: React 18 + Vite + Supabase (כמו ERUIT) + Vercel.

## הרצה מקומית

```bash
npm install
cp .env.example .env
# מלא ב-.env את VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY
npm run dev
```

## הקמת Supabase

1. צור פרויקט חדש (או השתמש בקיים) ב-supabase.com.
2. פתח את ה-SQL editor והרץ את הקובץ `supabase/schema.sql` — זה יוצר את כל
   הטבלאות (parties, party_revenues, party_entries, party_expenses,
   party_stock, products, entry_tiers, revenue_categories, expense_templates)
   כולל RLS בסיסי (גישה מלאה למשתמש authenticated).
3. אם תרצה להוסיף התחברות (Google OAuth כמו ב-ERUIT) — זה לא כלול כאן עדיין,
   כרגע ה-RLS מוגדר לדרוש authenticated. אפשר לרכך זמנית ל-`true` בפיתוח,
   או להוסיף Auth בהמשך.
4. קח את ה-URL וה-anon key מ-Settings → API והדבק ב-`.env`.

## מבנה הנתונים והחישוב

- **הכנסות** = סכום שורות הכנסה חופשיות + (כמות כרטיסים × מחיר שכבה)
- **הוצאות** = סכום שורות ההוצאה
- **סחורה (נטו)** = עלות הסחורה שנמכרה פחות ההכנסה ממנה (כלומר אם ההכנסה
  מהסחורה גבוהה מהעלות, זה "מוריד" מהעמודה ומוסיף לרווח)
- **רווח** = הכנסות − הוצאות − סחורה(נטו)

זו בדיוק הנוסחה שחישבתי מתוך המספרים באתר המקור (בדקתי כמה שורות כדי
לוודא שהיא מתאימה).

## פריסה ל-Vercel

```bash
git init
git add .
git commit -m "Initial commit — factory club manager"
git remote add origin <your-repo-url>
git push -u origin main
```

לאחר מכן חבר את הריפו ב-vercel.com, והוסף את שני משתני הסביבה
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) בהגדרות הפרויקט ב-Vercel.

## מה חסר / נקודות טובות לשיפור (בשבילך להמשיך)

- אין עדיין מסך התחברות (Auth) — אפשר להוסיף Google OAuth בדיוק כמו ב-ERUIT.
- אין validation מתקדם על טפסים.
- ה"התחשבנות" היא גרסת בסיס (טווח תאריכים + אחוז חלוקה) — אפשר להרחיב
  לניהול כמה שותפים, שמירת הסכמי חלוקה ב-DB, סטטוס "שולם/לא שולם" וכו'.
- אין עדיין ייצוא PDF (יש כפתור בעמוד המקורי) — אפשר להוסיף עם ספרייה כמו
  `jspdf` או `react-to-print`.
- "ארכיון" הוא כרגע רק דגל `archived` — עובד, אבל אפשר להוסיף סינון/חיפוש.
- אין realtime — Supabase תומך ב-`supabase.channel(...)` אם תרצה עדכונים
  חיים בין כמה מכשירים.
