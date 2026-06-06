export interface Mission {
  id: string;
  worldId: string;
  title: string;
  description: string;
  xpReward: number;
  templateCode: string;
  testLogic: string;
  type: 'lesson' | 'quiz' | 'boss';
  order: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  youtubeId?: string;
  isTeam?: boolean;
}

export interface World {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  missions: Mission[];
}

export const WORLDS: World[] = [
  {
    id: 'html-island',
    title: 'HTML oroli',
    description: 'Veb sahifalarning skeletini quring',
    icon: 'layout',
    color: 'from-orange-400 to-red-500',
    order: 1,
    missions: [
      {
        id: 'html-1',
        worldId: 'html-island',
        title: 'Asosiy Sarlavha',
        description: '<h1> tegi yordamida sarlavha yarating',
        xpReward: 100,
        templateCode: '<!-- <h1> Salom Dunyo </h1> -->\n',
        testLogic: 'code.includes("<h1>") && code.includes("</h1>")',
        type: 'lesson',
        order: 1,
        difficulty: 'easy',
        youtubeId: 'dQw4w9WgXcQ'
      },
      {
        id: 'html-2',
        worldId: 'html-island',
        title: 'Matn Paragrafi',
        description: '<p> tegi bilan matn yozing',
        xpReward: 110,
        templateCode: '<!-- <p> Matn shu yerda </p> -->\n',
        testLogic: 'code.includes("<p>") && code.includes("</p>")',
        type: 'lesson',
        order: 2,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-3',
        worldId: 'html-island',
        title: 'Qalin Matn',
        description: '<strong> tegi yordamida matnni qalinlashtiring',
        xpReward: 120,
        templateCode: '<p>Men <strong>kuchli</strong>man</p>',
        testLogic: 'code.includes("<strong>") && code.includes("</strong>")',
        type: 'lesson',
        order: 3,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-4',
        worldId: 'html-island',
        title: 'Kursiv Matn',
        description: '<em> tegi yordamida matnni kursiv qiling',
        xpReward: 130,
        templateCode: '<p>Bu matn <em>kursiv</em> holatda</p>',
        testLogic: 'code.includes("<em>") && code.includes("</em>")',
        type: 'lesson',
        order: 4,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-5',
        worldId: 'html-island',
        title: 'Tartibsiz Ro\'yxat',
        description: '<ul> va <li> yordamida ro\'yxat hosil qiling',
        xpReward: 140,
        templateCode: '<ul>\n  <li>Olma</li>\n  <li>Anor</li>\n</ul>',
        testLogic: 'code.includes("<ul>") && code.includes("<li>")',
        type: 'lesson',
        order: 5,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-6',
        worldId: 'html-island',
        title: 'Tartibli Ro\'yxat',
        description: '<ol> tegi yordamida raqamlangan ro\'yxat tuzing',
        xpReward: 150,
        templateCode: '<ol>\n  <li>Birinchi</li>\n  <li>Ikkinchi</li>\n</ol>',
        testLogic: 'code.includes("<ol>") && code.includes("<li>")',
        type: 'lesson',
        order: 6,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-7',
        worldId: 'html-island',
        title: 'Havolalar (Links)',
        description: '<a> tegi va href xususiyati bilan havola yarating',
        xpReward: 160,
        templateCode: '<a href="https://google.com">Google</a>',
        testLogic: 'code.includes("<a") && code.includes("href=")',
        type: 'lesson',
        order: 7,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-8',
        worldId: 'html-island',
        title: 'Rasmlar',
        description: '<img> tegi orqali rasm joylashtiring',
        xpReward: 170,
        templateCode: '<!-- src="https://placehold.co/100" ishlating -->\n<img src="">',
        testLogic: 'code.includes("<img") && code.includes("src=")',
        type: 'lesson',
        order: 8,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-9',
        worldId: 'html-island',
        title: 'Konteynerlar (Div)',
        description: '<div> tegi yordamida guruhlashni o\'rganing',
        xpReward: 180,
        templateCode: '<div>\n  <h1>Sarlavha</h1>\n  <p>Matn</p>\n</div>',
        testLogic: 'code.includes("<div>") && code.includes("</div>")',
        type: 'lesson',
        order: 9,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-10',
        worldId: 'html-island',
        title: 'Kirish Maydoni (Input)',
        description: '<input> tegi bilan matn kiritish maydoni yarating',
        xpReward: 190,
        templateCode: '<input type="text" placeholder="Ismingiz">',
        testLogic: 'code.includes("<input") && code.includes("type=\\"text\\"")',
        type: 'lesson',
        order: 10,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-11',
        worldId: 'html-island',
        title: 'Tugmalar (Button)',
        description: '<button> tegi yordamida tugma yarating',
        xpReward: 200,
        templateCode: '<button>Yuborish</button>',
        testLogic: 'code.includes("<button>") && code.includes("</button>")',
        type: 'lesson',
        order: 11,
        difficulty: 'easy',
        youtubeId: 'pvnXQYnNny4'
      },
      {
        id: 'html-12',
        worldId: 'html-island',
        title: 'Semantik HTML',
        description: '<header> va <footer> teglaridan foydalaning',
        xpReward: 250,
        templateCode: '<header>Yuqori qism</header>\n<footer>Pastki qism</footer>',
        testLogic: 'code.includes("<header>") && code.includes("<footer>")',
        type: 'lesson',
        order: 12,
        difficulty: 'medium',
        youtubeId: 'pvnXQYnNny4',
        isTeam: true
      }
    ]
  },
  {
    id: 'css-mountains',
    title: 'CSS Tog\'lari',
    description: 'Dizayn va ranglar dunyosi',
    icon: 'palette',
    color: 'from-blue-400 to-indigo-500',
    order: 2,
    missions: [
      {
        id: 'css-1',
        worldId: 'css-mountains',
        title: 'Matn Rangi',
        description: 'color xususiyati bilan matnni ko\'k qiling',
        xpReward: 200,
        templateCode: '<style>\n  h1 {\n    color: blue;\n  }\n</style>\n<h1>Ko\'k matn</h1>',
        testLogic: 'code.includes("color:") && (code.includes("blue") || code.includes("#0000ff"))',
        type: 'lesson',
        order: 1,
        difficulty: 'easy',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-2',
        worldId: 'css-mountains',
        title: 'Orqa Fon Rangi',
        description: 'background-color bilan fonni sarg\'ish qiling',
        xpReward: 210,
        templateCode: '<style>\n  div {\n    background-color: yellow;\n  }\n</style>\n<div>Sariq fon</div>',
        testLogic: 'code.includes("background-color:") && code.includes("yellow")',
        type: 'lesson',
        order: 2,
        difficulty: 'easy',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-3',
        worldId: 'css-mountains',
        title: 'Shrift Hajmi',
        description: 'font-size xususiyati bilan matnni kattalashtiring',
        xpReward: 220,
        templateCode: '<style>\n  p {\n    font-size: 24px;\n  }\n</style>\n<p>Katta matn</p>',
        testLogic: 'code.includes("font-size:") && code.includes("24px")',
        type: 'lesson',
        order: 3,
        difficulty: 'easy',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-4',
        worldId: 'css-mountains',
        title: 'Ichki Masofa (Padding)',
        description: 'padding yordamida ichki bo\'shliq yarating',
        xpReward: 230,
        templateCode: '<style>\n  div {\n    padding: 20px;\n    border: 1px solid black;\n  }\n</style>\n<div>Bo\'shliq bilan</div>',
        testLogic: 'code.includes("padding:") && code.includes("20px")',
        type: 'lesson',
        order: 4,
        difficulty: 'easy',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-5',
        worldId: 'css-mountains',
        title: 'Tashqi Masofa (Margin)',
        description: 'margin bilan element atrofida bo\'shliq yarating',
        xpReward: 240,
        templateCode: '<style>\n  h1 {\n    margin-top: 50px;\n  }\n</style>\n<h1>Pastga surilgan</h1>',
        testLogic: 'code.includes("margin-top:") && code.includes("50px")',
        type: 'lesson',
        order: 5,
        difficulty: 'easy',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-6',
        worldId: 'css-mountains',
        title: 'Chegaralar (Border)',
        description: 'border xususiyati bilan matnni o\'rab oling',
        xpReward: 250,
        templateCode: '<style>\n  p {\n    border: 2px solid green;\n  }\n</style>\n<p>Yashil chegara</p>',
        testLogic: 'code.includes("border:") && code.includes("solid")',
        type: 'lesson',
        order: 6,
        difficulty: 'easy',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-7',
        worldId: 'css-mountains',
        title: 'Kenglik va Balandlik',
        description: 'width va height bilan o\'lchamlarni bering',
        xpReward: 260,
        templateCode: '<style>\n  div {\n    width: 200px;\n    height: 100px;\n    background: gray;\n  }\n</style>\n<div>To\'rtburchak</div>',
        testLogic: 'code.includes("width:") && code.includes("height:")',
        type: 'lesson',
        order: 7,
        difficulty: 'easy',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-8',
        worldId: 'css-mountains',
        title: 'Matnni Tekislash',
        description: 'text-align yordamida matnni markazga suring',
        xpReward: 270,
        templateCode: '<style>\n  h1 {\n    text-align: center;\n  }\n</style>\n<h1>Markazda</h1>',
        testLogic: 'code.includes("text-align:") && code.includes("center")',
        type: 'lesson',
        order: 8,
        difficulty: 'easy',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-9',
        worldId: 'css-mountains',
        title: 'Hover Effekti',
        description: ':hover bilan tugma rangini o\'zgartiring',
        xpReward: 280,
        templateCode: '<style>\n  button:hover {\n    background: red;\n  }\n</style>\n<button>Menga yaqinlash</button>',
        testLogic: 'code.includes(":hover")',
        type: 'lesson',
        order: 9,
        difficulty: 'medium',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-10',
        worldId: 'css-mountains',
        title: 'Burchaklar (Border Radius)',
        description: 'border-radius bilan yumshoq burchaklar yarating',
        xpReward: 290,
        templateCode: '<style>\n  div {\n    border-radius: 15px;\n    background: blue;\n    width: 50px; height: 50px;\n  }\n</style>\n<div></div>',
        testLogic: 'code.includes("border-radius:")',
        type: 'lesson',
        order: 10,
        difficulty: 'medium',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-11',
        worldId: 'css-mountains',
        title: 'Flexbox Kirish',
        description: 'display: flex yordamida elementlarni yonma-yon qiling',
        xpReward: 350,
        templateCode: '<style>\n  .container {\n    display: flex;\n  }\n</style>\n<div class="container">\n  <div>1</div>\n  <div>2</div>\n</div>',
        testLogic: 'code.includes("display: flex")',
        type: 'lesson',
        order: 11,
        difficulty: 'hard',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-12',
        worldId: 'css-mountains',
        title: 'Justify Content',
        description: 'Elementlarni markazga tekislang',
        xpReward: 360,
        templateCode: '<style>\n  .box {\n    display: flex;\n    justify-content: center;\n  }\n</style>\n<div class="box">Markaz</div>',
        testLogic: 'code.includes("justify-content:")',
        type: 'lesson',
        order: 12,
        difficulty: 'hard',
        youtubeId: 'Y_SNo6UeB7g'
      },
      {
        id: 'css-13',
        worldId: 'css-mountains',
        title: 'Align Items',
        description: 'Elementlarni vertikal markazga keltiring',
        xpReward: 370,
        templateCode: '<style>\n  .root {\n    display: flex;\n    align-items: center;\n    height: 100vh;\n  }\n</style>',
        testLogic: 'code.includes("align-items:")',
        type: 'lesson',
        order: 13,
        difficulty: 'hard',
        youtubeId: 'Y_SNo6UeB7g'
      }
    ]
  },
  {
    id: 'js-city',
    title: 'JavaScript Shahri',
    description: 'Mantiq va harakatlar',
    icon: 'zap',
    color: 'from-yellow-400 to-yellow-600',
    order: 3,
    missions: [
      {
        id: 'js-1',
        worldId: 'js-city',
        title: 'O\'zgaruvchilar (let)',
        description: 'let bilan o\'zgaruvchi e\'lon qiling',
        xpReward: 300,
        templateCode: 'let message = "Salom";\nconsole.log(message);',
        testLogic: 'code.includes("let") && code.includes("=")',
        type: 'lesson',
        order: 1,
        difficulty: 'easy',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-2',
        worldId: 'js-city',
        title: 'O\'zgarmaslar (const)',
        description: 'const bilan qiymatni saqlang',
        xpReward: 310,
        templateCode: 'const age = 25;',
        testLogic: 'code.includes("const")',
        type: 'lesson',
        order: 2,
        difficulty: 'easy',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-3',
        worldId: 'js-city',
        title: 'Matnlarni birlashtirish',
        description: '+ operatori bilan matnlarni qo\'shing',
        xpReward: 320,
        templateCode: 'let s1 = "Salom";\nlet s2 = "Dunyo";\nlet res = s1 + " " + s2;',
        testLogic: 'code.includes("+")',
        type: 'lesson',
        order: 3,
        difficulty: 'easy',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-4',
        worldId: 'js-city',
        title: 'Matematika',
        description: 'Oddiy arifmetik amalni bajaring',
        xpReward: 330,
        templateCode: 'let num = 10 + 5;',
        testLogic: 'code.includes("10") && code.includes("+") && code.includes("5")',
        type: 'lesson',
        order: 4,
        difficulty: 'easy',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-5',
        worldId: 'js-city',
        title: 'Shartlar (if)',
        description: 'if yordamida tekshirish bajaring',
        xpReward: 340,
        templateCode: 'let x = 10;\nif (x > 5) {\n  console.log("X katta");\n}',
        testLogic: 'code.includes("if") && code.includes(">")',
        type: 'lesson',
        order: 5,
        difficulty: 'medium',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-6',
        worldId: 'js-city',
        title: 'Funksiyalar',
        description: 'function kalit so\'zi bilan funksiya yarating',
        xpReward: 350,
        templateCode: 'function sayHi() {\n  return "Salom";\n}',
        testLogic: 'code.includes("function")',
        type: 'lesson',
        order: 6,
        difficulty: 'medium',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-7',
        worldId: 'js-city',
        title: 'Parametrlar',
        description: 'Funksiyaga parametr bering',
        xpReward: 360,
        templateCode: 'function hello(name) {\n  return "Salom " + name;\n}',
        testLogic: 'code.includes("name")',
        type: 'lesson',
        order: 7,
        difficulty: 'medium',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-8',
        worldId: 'js-city',
        title: 'Massivlar (Arrays)',
        description: 'Ro\'yxat yarating',
        xpReward: 370,
        templateCode: 'let fruits = ["Olma", "Banan"];',
        testLogic: 'code.includes("[") && code.includes("]")',
        type: 'lesson',
        order: 8,
        difficulty: 'medium',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-9',
        worldId: 'js-city',
        title: 'Tsikllar (Loops)',
        description: 'for tsikli orqali matn chiqaring',
        xpReward: 380,
        templateCode: 'for (let i = 0; i < 5; i++) {\n  console.log(i);\n}',
        testLogic: 'code.includes("for") && code.includes("i++")',
        type: 'lesson',
        order: 9,
        difficulty: 'hard',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-10',
        worldId: 'js-city',
        title: 'Obyektlar',
        description: 'Ma\'lumotlarni obyektda saqlang',
        xpReward: 390,
        templateCode: 'let user = { name: "Ali", age: 20 };',
        testLogic: 'code.includes("{") && code.includes(":")',
        type: 'lesson',
        order: 10,
        difficulty: 'hard',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-11',
        worldId: 'js-city',
        title: 'Click Hodisasi',
        description: 'onclick yordamida tugma hodisasini bering',
        xpReward: 400,
        templateCode: '<button onclick="alert(\'Salom\')">Bos</button>',
        testLogic: 'code.includes("onclick")',
        type: 'lesson',
        order: 11,
        difficulty: 'medium',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-12',
        worldId: 'js-city',
        title: 'querySelector',
        description: 'Elementni JS orqali toping',
        xpReward: 410,
        templateCode: 'let el = document.querySelector("h1");',
        testLogic: 'code.includes("querySelector")',
        type: 'lesson',
        order: 12,
        difficulty: 'hard',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-13',
        worldId: 'js-city',
        title: 'innerHTML',
        description: 'Element matnini JS orqali o\'zgartiring',
        xpReward: 420,
        templateCode: 'document.querySelector("p").innerHTML = "Yangi matn";',
        testLogic: 'code.includes("innerHTML")',
        type: 'lesson',
        order: 13,
        difficulty: 'hard',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-14',
        worldId: 'js-city',
        title: 'Arrow Funksiyalar',
        description: 'Zamonaviy funksiya yozing',
        xpReward: 430,
        templateCode: 'const add = (a, b) => a + b;',
        testLogic: 'code.includes("=>")',
        type: 'lesson',
        order: 14,
        difficulty: 'hard',
        youtubeId: 'RmvAn7vsz4U'
      },
      {
        id: 'js-15',
        worldId: 'js-city',
        title: 'Ma\'lumot Turlari',
        description: 'typeof yordamida turni aniqlang',
        xpReward: 440,
        templateCode: 'let x = 10;\nconsole.log(typeof x);',
        testLogic: 'code.includes("typeof")',
        type: 'lesson',
        order: 15,
        difficulty: 'hard',
        youtubeId: 'RmvAn7vsz4U'
      }
    ]
  },
  {
    id: 'react-galaxy',
    title: 'React Galaktikasi',
    description: 'Zamonaviy komponentlar',
    icon: 'atom',
    color: 'from-cyan-400 to-blue-600',
    order: 4,
    missions: [
      {
        id: 'react-1',
        worldId: 'react-galaxy',
        title: 'JSX Kirish',
        description: 'JSX da sarlavha qaytaring',
        xpReward: 500,
        templateCode: 'const Element = () => {\n  return <h1>React!</h1>;\n};',
        testLogic: 'code.includes("return") && code.includes("<h1>")',
        type: 'lesson',
        order: 1,
        difficulty: 'medium',
        youtubeId: 'bMknfKXIFA8'
      },
      {
        id: 'react-2',
        worldId: 'react-galaxy',
        title: 'Komponentlar',
        description: 'Yangi komponent yarating',
        xpReward: 510,
        templateCode: 'function MyButton() {\n  return <button>Click</button>;\n}',
        testLogic: 'code.includes("function") && code.includes("<button>")',
        type: 'lesson',
        order: 2,
        difficulty: 'medium',
        youtubeId: '69X58n6zC1Q'
      },
      {
        id: 'react-3',
        worldId: 'react-galaxy',
        title: 'Props',
        description: 'Ma\'lumotlarni props orqali o\'tkazing',
        xpReward: 520,
        templateCode: 'const User = (props) => {\n  return <p>{props.name}</p>;\n};',
        testLogic: 'code.includes("props.")',
        type: 'lesson',
        order: 3,
        difficulty: 'medium',
        youtubeId: '_S987_z9M7A'
      },
      {
        id: 'react-4',
        worldId: 'react-galaxy',
        title: 'useState Hook',
        description: 'Holatni (state) boshqarishni o\'rganing',
        xpReward: 530,
        templateCode: 'const [count, setCount] = useState(0);',
        testLogic: 'code.includes("useState")',
        type: 'lesson',
        order: 4,
        difficulty: 'hard',
        youtubeId: 'f6-u6f6zC_U'
      },
      {
        id: 'react-5',
        worldId: 'react-galaxy',
        title: 'Click Hodisasi',
        description: 'onClick yordamida hodisani ushlang',
        xpReward: 540,
        templateCode: '<button onClick={() => console.log("Bosildi")}>Click</button>',
        testLogic: 'code.includes("onClick")',
        type: 'lesson',
        order: 5,
        difficulty: 'hard',
        youtubeId: 'f6-u6f6zC_U'
      },
      {
        id: 'react-6',
        worldId: 'react-galaxy',
        title: 'Shartli Render',
        description: 'If yordamida komponent chiqaring',
        xpReward: 550,
        templateCode: '{isLoggedIn && <Dashboard />}',
        testLogic: 'code.includes("&&")',
        type: 'lesson',
        order: 6,
        difficulty: 'hard',
        youtubeId: 'f6-u6f6zC_U'
      },
      {
        id: 'react-7',
        worldId: 'react-galaxy',
        title: 'Ro\'yxatlar (map)',
        description: 'Massivni render qiling',
        xpReward: 560,
        templateCode: 'items.map(item => <li key={item.id}>{item.name}</li>)',
        testLogic: 'code.includes(".map")',
        type: 'lesson',
        order: 7,
        difficulty: 'hard',
        youtubeId: 'f6-u6f6zC_U'
      },
      {
        id: 'react-8',
        worldId: 'react-galaxy',
        title: 'useEffect Hook',
        description: 'Yon ta\'sirlarni o\'rganing',
        xpReward: 570,
        templateCode: 'useEffect(() => {\n  console.log("Mounted");\n}, []);',
        testLogic: 'code.includes("useEffect")',
        type: 'lesson',
        order: 8,
        difficulty: 'hard',
        youtubeId: '69X58n6zC1Q'
      },
      {
        id: 'react-9',
        worldId: 'react-galaxy',
        title: 'Input State',
        description: 'Input qiymatini state-da saqlang',
        xpReward: 580,
        templateCode: '<input value={text} onChange={(e) => setText(e.target.value)} />',
        testLogic: 'code.includes("onChange") && code.includes("target.value")',
        type: 'lesson',
        order: 9,
        difficulty: 'hard',
        youtubeId: '69X58n6zC1Q'
      },
      {
        id: 'react-10',
        worldId: 'react-galaxy',
        title: 'Komponentlararo aloqa',
        description: 'Callback funksiyalarni passing qilish',
        xpReward: 600,
        templateCode: '<Child onAction={() => handleAction()} />',
        testLogic: 'code.includes("onAction")',
        type: 'lesson',
        order: 10,
        difficulty: 'hard',
        youtubeId: '69X58n6zC1Q',
        isTeam: true
      }
    ]
  }
];

export const BADGES = [
  { id: 'first-code', name: 'Birinchi Kod', icon: '🚀' },
  { id: 'html-ninja', name: 'HTML Ninja', icon: '📜' },
  { id: 'css-master', name: 'CSS Master', icon: '🎨' },
  { id: 'js-wizard', name: 'JS Wizard', icon: '⚡' },
  { id: 'react-hero', name: 'React Hero', icon: '⚛️' },
  { id: 'streak-7', name: '7 kunlik olov', icon: '🔥' },
];
