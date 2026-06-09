# users

## API query support
يمكن استخدام نقطة النهاية `/api/data` مع معلمات استعلام بسيطة:

- `search` — بحث نصي عام في المستخدمين، الهاتف، النشاط، مفتاح المستخدم، الفئات والتخصصات.
- `accountFilter` — فلترة حسب نوع الحساب: `all`, `buyer`, `merchant`, `delivery`, `admin`.

مثال:

`/api/data?search=عبد&accountFilter=merchant`

