/*
 * MOCK DATA FOR UI DEVELOPMENT ONLY.
 * Ingredients, allergens and "verified" dates here are illustrative and NOT verified.
 * Never import this into Directus or show it to real users.
 *
 * Covers: hidden ingredients, every warning status, missing translations
 * (uz/mn/ne fall back to English; one dish has no vi), an unverified dish,
 * a dish without photo, and published / empty / closed cafeterias.
 */
import type { AllergenView, CafeteriaView, DishView, IngredientView, MenuView } from "../types";

const A = {
  egg: { code: "egg", name: { ko: "알류", en: "Egg", vi: "Trứng", zh: "鸡蛋" } },
  milk: { code: "milk", name: { ko: "우유", en: "Milk", vi: "Sữa", zh: "牛奶" } },
  wheat: { code: "wheat", name: { ko: "밀", en: "Wheat", vi: "Lúa mì", zh: "小麦" } },
  soy: { code: "soy", name: { ko: "대두", en: "Soybean", vi: "Đậu nành", zh: "大豆" } },
  pork: { code: "pork", name: { ko: "돼지고기", en: "Pork", vi: "Thịt heo", zh: "猪肉" } },
  beef: { code: "beef", name: { ko: "쇠고기", en: "Beef", vi: "Thịt bò", zh: "牛肉" } },
  shrimp: { code: "shrimp", name: { ko: "새우", en: "Shrimp", vi: "Tôm", zh: "虾" } },
  shellfish: {
    code: "shellfish",
    name: { ko: "조개류", en: "Shellfish", vi: "Động vật có vỏ", zh: "贝类" },
  },
} satisfies Record<string, AllergenView>;

const ing = (
  ko: string,
  en: string,
  vi: string,
  zh: string,
  isMain = true,
  isHidden = false,
): IngredientView => ({
  name: { ko, en, vi, zh },
  isMain,
  isHidden,
});

export const fixtureDishes: DishView[] = [
  {
    id: "dish-doenjang-jjigae",
    name: { ko: "된장찌개", en: "Soybean paste stew", vi: "Canh tương đậu", zh: "大酱汤" },
    description: {
      ko: "된장을 풀어 두부와 채소를 넣고 끓인 찌개",
      en: "Stew of fermented soybean paste with tofu and vegetables",
      vi: "Canh tương đậu nành lên men nấu với đậu phụ và rau",
      zh: "用大酱、豆腐和蔬菜炖煮的汤",
    },
    photoUrl: null,
    spiceLevel: 1,
    ingredients: [
      ing("된장", "Soybean paste", "Tương đậu nành", "大酱"),
      ing("두부", "Tofu", "Đậu phụ", "豆腐"),
      ing("애호박", "Zucchini", "Bí ngòi", "西葫芦"),
      ing("멸치 육수", "Anchovy broth", "Nước dùng cá cơm", "鳀鱼高汤", false, true),
    ],
    allergens: [A.soy],
    dietTags: ["seafood"],
    allergensConfirmed: true,
    verifiedAt: "2026-11-20",
  },
  {
    id: "dish-jeyuk-bokkeum",
    name: { ko: "제육볶음", en: "Spicy stir-fried pork", vi: "Thịt heo xào cay", zh: "辣炒猪肉" },
    description: {
      ko: "고추장 양념에 볶은 돼지고기",
      en: "Pork stir-fried in red pepper paste",
      vi: "Thịt heo xào với tương ớt Hàn Quốc",
      zh: "用辣椒酱炒的猪肉",
    },
    photoUrl: "https://placehold.co/400x300?text=Jeyuk",
    spiceLevel: 3,
    ingredients: [
      ing("돼지고기", "Pork", "Thịt heo", "猪肉"),
      ing("양파", "Onion", "Hành tây", "洋葱"),
      ing("고추장", "Red pepper paste", "Tương ớt", "辣椒酱", false, true),
    ],
    allergens: [A.pork, A.soy, A.wheat],
    dietTags: ["pork"],
    allergensConfirmed: true,
    verifiedAt: "2026-11-20",
  },
  {
    id: "dish-miyeokguk",
    name: { ko: "미역국", en: "Seaweed soup", vi: "Canh rong biển", zh: "海带汤" },
    photoUrl: "https://placehold.co/400x300?text=Miyeokguk",
    spiceLevel: 0,
    ingredients: [
      ing("미역", "Seaweed", "Rong biển", "海带"),
      ing("소고기", "Beef", "Thịt bò", "牛肉", false, true),
      ing("국간장", "Soup soy sauce", "Nước tương nấu canh", "汤用酱油", false, true),
    ],
    allergens: [A.beef, A.soy, A.wheat],
    dietTags: ["beef"],
    allergensConfirmed: true,
    verifiedAt: "2026-11-18",
  },
  {
    id: "dish-yachae-bibimbap",
    name: { ko: "야채비빔밥", en: "Vegetable bibimbap", vi: "Cơm trộn rau", zh: "蔬菜拌饭" },
    photoUrl: "https://placehold.co/400x300?text=Bibimbap",
    spiceLevel: 2,
    ingredients: [
      ing("밥", "Rice", "Cơm", "米饭"),
      ing("나물", "Seasoned vegetables", "Rau trộn", "拌野菜"),
      ing("달걀", "Egg", "Trứng", "鸡蛋"),
      ing("고추장", "Red pepper paste", "Tương ớt", "辣椒酱", false, true),
    ],
    allergens: [A.egg, A.soy, A.wheat],
    dietTags: [],
    allergensConfirmed: true,
    verifiedAt: "2026-11-18",
  },
  {
    id: "dish-tteokbokki",
    name: { ko: "떡볶이", en: "Spicy rice cakes", vi: "Bánh gạo cay", zh: "辣炒年糕" },
    photoUrl: "https://placehold.co/400x300?text=Tteokbokki",
    spiceLevel: 4,
    ingredients: [
      ing("떡", "Rice cake", "Bánh gạo", "年糕"),
      ing("어묵", "Fish cake", "Chả cá", "鱼饼", true, true),
      ing("멸치 육수", "Anchovy broth", "Nước dùng cá cơm", "鳀鱼高汤", false, true),
    ],
    allergens: [A.wheat, A.soy],
    dietTags: ["seafood"],
    allergensConfirmed: true,
    verifiedAt: "2026-11-19",
  },
  {
    id: "dish-japchae",
    name: { ko: "잡채", en: "Glass noodles with vegetables", vi: "Miến trộn japchae", zh: "杂菜" },
    photoUrl: "https://placehold.co/400x300?text=Japchae",
    spiceLevel: 0,
    ingredients: [
      ing("당면", "Glass noodles", "Miến", "粉丝"),
      ing("시금치", "Spinach", "Rau chân vịt", "菠菜"),
      ing("돼지고기", "Pork", "Thịt heo", "猪肉", false, true),
      ing("간장", "Soy sauce", "Nước tương", "酱油", false, true),
    ],
    allergens: [A.pork, A.soy, A.wheat],
    dietTags: ["pork"],
    allergensConfirmed: true,
    verifiedAt: "2026-11-19",
  },
  {
    id: "dish-kimchi",
    name: { ko: "배추김치", en: "Cabbage kimchi", vi: "Kim chi cải thảo", zh: "辣白菜泡菜" },
    photoUrl: "https://placehold.co/400x300?text=Kimchi",
    spiceLevel: 2,
    ingredients: [
      ing("배추", "Napa cabbage", "Cải thảo", "白菜"),
      ing("고춧가루", "Red pepper flakes", "Ớt bột", "辣椒粉"),
      ing("새우젓", "Salted shrimp", "Mắm tôm", "虾酱", false, true),
      ing("멸치액젓", "Anchovy fish sauce", "Nước mắm cá cơm", "鳀鱼鱼露", false, true),
    ],
    allergens: [A.shrimp],
    dietTags: ["seafood"],
    allergensConfirmed: true,
    verifiedAt: "2026-11-18",
  },
  {
    id: "dish-sundubu-jjigae",
    name: { ko: "순두부찌개", en: "Soft tofu stew", vi: "Canh đậu phụ non", zh: "嫩豆腐汤" },
    photoUrl: "https://placehold.co/400x300?text=Sundubu",
    spiceLevel: 3,
    ingredients: [ing("순두부", "Soft tofu", "Đậu phụ non", "嫩豆腐")],
    allergens: [],
    dietTags: [],
    allergensConfirmed: false,
    verifiedAt: null,
  },
  {
    id: "dish-donkkaseu",
    name: { ko: "돈까스", en: "Pork cutlet", zh: "炸猪排" },
    photoUrl: "https://placehold.co/400x300?text=Donkkaseu",
    spiceLevel: 0,
    ingredients: [
      ing("돼지고기", "Pork", "Thịt heo", "猪肉"),
      ing("빵가루", "Breadcrumbs", "Vụn bánh mì", "面包糠"),
      ing("돈까스 소스", "Cutlet sauce", "Sốt tonkatsu", "猪排酱", false, true),
    ],
    allergens: [A.pork, A.wheat, A.egg, A.milk, A.soy],
    dietTags: ["pork"],
    allergensConfirmed: true,
    verifiedAt: "2026-11-21",
  },
  {
    id: "dish-udon",
    name: { ko: "가락국수", en: "Udon noodle soup", vi: "Mì udon", zh: "乌冬面" },
    photoUrl: "https://placehold.co/400x300?text=Udon",
    spiceLevel: 0,
    ingredients: [
      ing("우동면", "Udon noodles", "Sợi udon", "乌冬面条"),
      ing("가쓰오 육수", "Bonito broth", "Nước dùng cá ngừ khô", "鲣鱼高汤", false, true),
      ing("바지락", "Clams", "Nghêu", "蛤蜊", false, true),
    ],
    allergens: [A.wheat, A.soy, A.shellfish],
    dietTags: ["seafood"],
    allergensConfirmed: true,
    verifiedAt: "2026-11-21",
  },
];

export const fixtureCafeterias: CafeteriaView[] = [
  {
    id: "caf-main",
    code: "main-hall",
    name: {
      ko: "학생회관 식당",
      en: "Student Union Cafeteria",
      vi: "Căn tin Hội sinh viên",
      zh: "学生会馆食堂",
    },
    openingHours: { lunch: "11:30-13:30", dinner: "17:00-18:30" },
  },
  {
    id: "caf-dorm",
    code: "dorm",
    name: { ko: "기숙사 식당", en: "Dormitory Cafeteria", vi: "Căn tin ký túc xá", zh: "宿舍食堂" },
    openingHours: { lunch: "11:30-13:00", dinner: "17:30-19:00" },
  },
  {
    id: "caf-eng",
    code: "engineering",
    name: {
      ko: "공대 식당",
      en: "Engineering Cafeteria",
      vi: "Căn tin khoa Kỹ thuật",
      zh: "工学院食堂",
    },
    openingHours: { lunch: "11:30-13:30" },
  },
];

const dish = (id: string): DishView => {
  const found = fixtureDishes.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown fixture dish ${id}`);
  return found;
};

const [main, dorm, eng] = fixtureCafeterias as [CafeteriaView, CafeteriaView, CafeteriaView];

export const fixtureMenus: Record<string, MenuView> = {
  "main-hall": {
    cafeteria: main,
    date: "2026-11-25",
    meal: "lunch",
    status: "published",
    corners: [
      {
        id: "corner-korean",
        name: { ko: "한식", en: "Korean", vi: "Món Hàn", zh: "韩餐" },
        items: [
          { dish: dish("dish-doenjang-jjigae"), price: 5000 },
          { dish: dish("dish-jeyuk-bokkeum"), price: 5500 },
          { dish: dish("dish-miyeokguk"), price: 4500 },
          { dish: dish("dish-yachae-bibimbap"), price: 5000 },
          { dish: dish("dish-sundubu-jjigae"), price: 5500 },
        ],
      },
      {
        id: "corner-snack",
        name: { ko: "분식", en: "Snacks & Noodles", vi: "Món ăn nhẹ & mì", zh: "小吃和面" },
        items: [
          { dish: dish("dish-tteokbokki"), price: 4000 },
          { dish: dish("dish-udon"), price: 4500 },
          { dish: dish("dish-donkkaseu"), price: 6000 },
        ],
      },
      {
        id: "corner-side",
        name: { ko: "공통 반찬", en: "Shared side dishes", vi: "Món ăn kèm chung", zh: "共同小菜" },
        items: [
          { dish: dish("dish-japchae"), price: null },
          { dish: dish("dish-kimchi"), price: null },
        ],
      },
    ],
  },
  dorm: { cafeteria: dorm, date: "2026-11-25", meal: "lunch", status: "empty", corners: [] },
  engineering: { cafeteria: eng, date: "2026-11-25", meal: "lunch", status: "closed", corners: [] },
};
