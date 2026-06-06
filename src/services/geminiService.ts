import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../lib/firebase";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey });
};

export const askMentor = async (query: string, context?: { code?: string; topic?: string; error?: string; description?: string; selectedCode?: string }) => {
  const ai = getAI();
  const systemInstruction = `
    Siz DevEdu platformasining AI Mentorisiz. 
    Platforma O'zbekistondagi yosh dasturchilar uchun mo'ljallangan. 
    Sizning vazifangiz:
    1. HTML, CSS, JavaScript va React mavzularini tushuntirish.
    2. Foydalanuvchi kodidagi xatolarni topish va ularni qanday tuzatishni ko'rsatish (to'liq kodni bermasdan, maslahat berishga harakat qiling).
    3. Agar foydalanuvchi kodning bir qismini tanlab (selection) savol bergan bo'lsa, aynan shu qismga ko'proq e'tibor bering.
    4. Savollarga O'zbek tilida, sodda va qiziqarli (gamifikatsiyaga mos) javob berish.
    
    Hozirgi mavzu: ${context?.topic || "Umumiy dasturlash"}
    Vazifa tavsifi: ${context?.description || "Yo'q"}
    Foydalanuvchi tanlab olgan kod qismi (Selected Selection):
    \`\`\`
    ${context?.selectedCode || "Kod tanlanmagan"}
    \`\`\`
    To'liq kod: 
    \`\`\`
    ${context?.code || "Kod yo'q"}
    \`\`\`
    Xato (agar bo'lsa): ${context?.error || "Xato yo'q"}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Uzr, hozircha savolingizga javob bera olmayman. Keyinroq urinib ko'ring.";
  }
};

export const reviewCode = async (code: string, missionTitle: string) => {
  const ai = getAI();
  const systemInstruction = `
    Siz code reviewer-siz. "${missionTitle}" mavzusidagi kodni tekshiring.
    Agar kod to'g'ri bo'lsa, uning kuchli tomonlarini ayting.
    Agar xato bo'lsa, uni tuzatish uchun 3 ta qisqa maslahat bering.
    O'zbek tilida javob bering.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: code,
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    return "Kod tahlilida xatolik yuz berdi.";
  }
};

export const generateBonusChallenge = async (currentMission: { title: string; description: string }) => {
  const ai = getAI();
  const prompt = `
    Foydalanuvchi hozirgina "${currentMission.title}" topshirig'ini bajardi.
    Topshiriq mazmuni: ${currentMission.description}
    
    Ushbu mavzuga doir yangi, qiyinroq "Bonus Challenge" topshirig'ini yarating.
    Javob faqat JSON formatida bo'lsin:
    {
      "title": "Topshiriq sarlavhasi",
      "description": "Topshiriq sharti (nima qilish kerakligi)",
      "templateCode": "Boshlang'ich kod",
      "testLogic": "Kod ichida bo'lishi kerak bo'lgan so'z yoki belgi (masalan: code.includes('...') )",
      "xpReward": 200,
      "difficulty": "medium"
    }
    Topshiriq O'zbek tilida bo'lsin.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Mission Generation Error:", error);
    throw error;
  }
};

export const generatePersonalizedPath = async (userProfile: UserProfile) => {
  const ai = getAI();
  const prompt = `
    Siz professional IT metodist va Senior ed-tech mutaxassisiz.
    Foydalanuvchi ma'lumotlari bo'yicha mukammal, ketma-ketlikka asoslangan shaxsiylashtirilgan o'quv rejasini (learning path) yarating.
    
    Foydalanuvchi profili:
    - Ism: ${userProfile.displayName}
    - Jami XP: ${userProfile.xp}
    - Bajarilgan topshiriqlar: ${userProfile.completedMissions?.length || 0} ta
    - Qiziqishlar: ${(userProfile.interests || []).join(', ')}
    
    Talablar:
    1. O'quv rejasi aynan foydalanuvchining qiziqishlariga asoslangan bo'lishi kerak.
    2. Reja EXACTLY 30 ta mantiqiy bog'langan missiyadan iborat bo'lsin. Ketma-ketlik soddadan murakkabga qarab borishi shart.
    3. Har bir missiya uchun 'testLogic' maydonida kodni tekshirish uchun JavaScript sharti bo'lishi shart.
    4. Har bir missiya uchun (30 taning hammasi uchun) mavzuga doir haqiqiy YouTube video ID sini ('youtubeId' maydoni) qidirib topib yozing. Bu majburiy talab!
    5. Barcha matnlarni O'zbek tilida, motivatsiya beruvchi va professional tilda yozing.

    Javob faqat JSON formatida bo'lsin:
    {
      "pathTitle": "Yo'nalishning jozibador nomi",
      "description": "Ushbu yo'nalish nima uchun foydali ekanligi haqida motivatsiya",
      "missions": [
        {
          "title": "Missiya nomi",
          "description": "Vazifa sharti va nima o'rgatishi haqida",
          "templateCode": "Boshlang'ich kod",
          "testLogic": "Kod mantiqiy tekshiruvi",
          "youtubeId": "YouTube Video ID (masalan: dQw4w9WgXcQ)",
          "xpReward": 200,
          "difficulty": "easy/medium/hard"
        }
      ]
    }
    CRITICAL: 30 ta missiyaning HAR BIRIDA 'youtubeId' bo'lishi shart. Bo'sh qolishi yoki null bo'lishi mumkin emas. Mavzuga mos o'quv videosini toping.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Personalized Path Error:", error);
    throw error;
  }
};

export const getTopicExplanation = async (topic: string, description: string) => {
  const ai = getAI();
  const prompt = `
    Siz IT o'qituvchisiz. "${topic}" mavzusini yangi boshlayotgan o'quvchiga tushuntirib bering.
    
    Vazifa: ${description}
    
    Qoidalar:
    1. O'zbek tilida, do'stona va sodda tilda yozing.
    2. Mavzuning asosiy tushunchalarini tushuntiring.
    3. Misollar keltiring.
    4. Markdown formatidan foydalaning.
    5. Javob qisqa va lo'nda bo'lsin (o'qishga oson).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Mavzu bo'yicha ma'lumot topilmadi.";
  }
};
