import fs from "fs";
import path from "path";
import { Chapter, DatabaseSchema, MediaItem } from "@/types/book";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "book-db.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export const INITIAL_SEED: DatabaseSchema = {
  bookTitle: "Константин Георгиев Фотинов (ок. 1785 – 1858)",
  bookAuthor: "Стоян Калчев и Константин Караниколов",
  bookDescription:
    "Монографично историко-филологическо изследване на живота, смирненското училище, сп. „Любословие“, материалната топография в Самоков и библейския превод на Константин Фотинов.",
  chapters: [
    {
      id: "slide-1",
      slug: "prologue",
      title: "Слайд I: Константин Георгиев Фотинов (ок. 1785 – 1858)",
      subtitle: "Направено от Стоян Калчев и Константин Караниколов",
      order: 1,
      status: "published",
      readingTimeMinutes: 2,
      narratorAudioUrl: "",
      narratorTranscript:
        "Константин Георгиев Фотинов — монографично изследване, изготвено от Стоян Калчев и Константин Караниколов.",
      blocks: [
        {
          id: "blk-101",
          type: "image",
          mediaUrl: "/uploads/fotinov-portrait-classic.png",
          mediaType: "image",
          caption:
            "Константин Георгиев Фотинов (ок. 1785 – 1858) — възрожденски просветител, книжовник и основоположник на периодичния печат.",
          alt: "Портрет на Константин Фотинов",
          content:
            "<strong>Константин Георгиев Фотинов</strong> заема основополагащо място в Българското възраждане. Основател на първото списание <em>„Любословие“ (1844–1846)</em>, преводач, педагог и пионер в борбата за девическо образование.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "top",
          pageSide: "left",
        },
        {
          id: "blk-102",
          type: "quote",
          content: "Направено от Стоян Калчев и Константин Караниколов",
          quoteAuthor:
            "Монографичен историко-филологически проект за Българското възраждане (10Г клас)",
          align: "center",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-2",
      slug: "intelektualna-geneza",
      title: "Слайд II: 1.1. Интелектуална генеза и образование",
      subtitle:
        "Самоков, Пловдив (К. Икономос), Кидония (Т. Каирис) и метохът на баба Фота",
      order: 2,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Образователен път на Константин Фотинов: килийно училище в Самоков, Пловдив при Константин Икономос и Кидония при Теофилос Каирис.",
      blocks: [
        {
          id: "blk-201",
          type: "image",
          mediaUrl: "/uploads/samokov-convent-pokrov.jpg",
          mediaType: "image",
          caption:
            "Девически манастир „Покров Богородичен“ в Самоков, основан от баба Фота (ок. 1772 г.), където Фотинов получава първоначална грамотност.",
          alt: "Самоковски девически манастир Покров Богородичен",
          content:
            "Роден в Самоков (ок. 1785 г.), Константин получава първоначално образование в килийното училище при метоха на баба си <strong>монахиня хаджи Фота</strong>. Родът приема нейното име като символ на духовна приемственост.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "center",
          pageSide: "left",
        },
        {
          id: "blk-202",
          type: "paragraph",
          content:
            "<strong>Елински хуманизъм:</strong> Продължава в гръцкото класно училище в Пловдив при <strong>Константин Икономос</strong> и в академията в Кидония при <strong>Теофилос Каирис</strong>. Макар в младостта да се подписва като <em>Константинос Фотиадис</em>, европейският рационализъм укрепва българското му национално самосъзнание.",
          align: "left",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-3",
      slug: "smirnenski-period",
      title: "Слайд III: 1.2. Смирненският период (от 1828 г.)",
      subtitle:
        "Смесеното училище, учебникарското дело и преводът на Т. Галаудет",
      order: 3,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "През 1828 година Фотинов открива в Смирна частно смесено елино-българско училище по взаимоучителната метода и сътрудничи с доктор Илайъс Ригс.",
      blocks: [
        {
          id: "blk-301",
          type: "image",
          mediaUrl: "/uploads/fotinov-grammar-phrasebook.png",
          mediaType: "image",
          caption:
            "Факсимилета на Фотиновите учебни издания: „Гръцка граматика“ (1838) и „Болгарский разговорник“ (1845).",
          alt: "Учебни помагала на Константин Фотинов",
          content:
            "През 1828 г. Фотинов открива в Смирна частно <strong>смесено елино-българско училище</strong> по Бел-Ланкастърската метода. За него издава <em>„Гръцка граматика“ (1838)</em>, <em>„Общое землеописание“ (1843)</em> и <em>„Болгарский разговорник“ (1845)</em>.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "center",
          pageSide: "left",
        },
        {
          id: "blk-302",
          type: "image",
          mediaUrl: "/uploads/gallaudet-dusheslovie.png",
          mediaType: "image",
          caption:
            "Заглавна страница на „Душесловие за поучение на децата“ — превод от Томас Х. Галаудет.",
          alt: "Душесловие от Томас Галаудет в превод на Фотинов",
          content:
            "<strong>Детска психология и педагогика:</strong> Фотинов превежда <em>„Душесловие за поучение на децата“</em> от американския педагог Томас Х. Галаудет и сътрудничи с д-р Илайъс Ригс за първата граматика на български език на английски (1844 г.).",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "center",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-4",
      slug: "lyuboslovie-poligrafiya",
      title: "Слайд IV: 2.1. Списание „Любословие“ (1842; 1844–1846)",
      subtitle:
        "Раждане на българската журналистика и борба за девическо образование",
      order: 4,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Списание Любословие се печата в типографията на Антониос Дамянос в Смирна с английски наборни шрифтове.",
      blocks: [
        {
          id: "blk-401",
          type: "image",
          mediaUrl: "/uploads/lyuboslovie-original-issue.jpg",
          mediaType: "image",
          caption:
            "Оригинално издание на сп. „Любословие“ от печатницата на Антониос Дамянос в Смирна (1844 г.).",
          alt: "Списание Любословие Смирна",
          content:
            "След пробен брой през 1842 г., от <strong>април 1844 до 1846 г.</strong> в Смирна излизат 24 книжки на <strong>сп. „Любословие“</strong> — първото българско периодично издание, поставило началото на родната журналистика.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "center",
          pageSide: "left",
        },
        {
          id: "blk-402",
          type: "image",
          mediaUrl: "/uploads/female-education-samokov.png",
          mediaType: "image",
          caption:
            "„Возобразование женскаго пола“ — защита на девическото образование и Самоковската девическа гимназия.",
          alt: "Возобразование женскаго пола сп Любословие",
          content:
            "<strong>„Возобразование женскаго пола“:</strong> Списанието има енциклопедичен характер. Фотинов защитава правото на българската жена на светско образование, стимулирайки откриването на девически училища.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "landscape",
          imageFocus: "center",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-5",
      slug: "lyuboslovie-spirane",
      title: "Слайд V: 2.2. Причини за спиране на „Любословие“",
      subtitle:
        "Пощенско-финансови дефицити и езиковият спор с одеския кръг",
      order: 5,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Причини за спирането на списание Любословие: пощенски и финансови дефицити и езиковите спорове с одеския кръг на Васил Априлов.",
      blocks: [
        {
          id: "blk-501",
          type: "paragraph",
          content:
            "<strong>Логистичен и финансов колапс:</strong> Липсата на редовни пощи в Османската империя води до бавно разпространение и несъбрани такси. От 480 абонати през 1844 г., през 1846 г. редовно плащащите спадат до около 125, което прави по-нататъшното отпечатване невъзможно.",
          align: "left",
          pageSide: "left",
        },
        {
          id: "blk-502",
          type: "paragraph",
          content:
            "<strong>Езиков спор с Васил Априлов:</strong> Фотинов следва архаизиращ църковнославянски правопис със западнобългарски диалектизми. Одеският кръг начело с Васил Априлов настоява за новобългарски книжовен език върху източнобългарска основа, подлагайки „Любословие“ на остра критика.",
          align: "left",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-6",
      slug: "topografiya-samokov",
      title: "Слайд VI: 3.1. Материална топография в Самоков",
      subtitle: "Исторически музей, родовият имот и Бельова църква",
      order: 6,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Деконструкция на мита за запазена родна къща-музей на Константин Фотинов в Самоков и локализиране на семейния имот северозападно от Девическия манастир.",
      blocks: [
        {
          id: "blk-601",
          type: "image",
          mediaUrl: "/uploads/samokov-museum-exhibition.jpg",
          mediaType: "image",
          caption:
            "Документална експозиция с оригинали на сп. „Любословие“ в Исторически музей – Самоков.",
          alt: "Експозиция в Исторически музей Самоков",
          content:
            "<strong>Деконструкция на мита:</strong> В Самоков няма запазена родна къща-музей на Фотинов. Семейният имот се е намирал северозападно от Девическия манастир. Историческият музей в града съхранява оригинални броеве и архивни реликви от книжовника.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "landscape",
          imageFocus: "center",
          pageSide: "left",
        },
        {
          id: "blk-602",
          type: "image",
          mediaUrl: "/uploads/belyova-church-samokov.jpg",
          mediaType: "image",
          caption:
            "Бельова църква „Рождество Богородично“ край Самоков — духовен стълб на възрожденския град.",
          alt: "Бельова църква край Самоков",
          content:
            "<strong>Сакрална среда:</strong> Духовният климат на Самоков се формира около Бельова църква „Рождество Богородично“ и зографските школи, от които Фотинов черпи първите си импулси за просвещение и църковна книжнина.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "landscape",
          imageFocus: "center",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-7",
      slug: "pamet-i-monumenti",
      title: "Слайд VII: 3.2. Мемориална памет в Самоков",
      subtitle:
        "Гимназията от 1894 г. и паметниците в Самоков (1894, двор и 2015 г.)",
      order: 7,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Съвременни форми на памет в Самоков: черният мраморен релеф от 1894 година и бронзовият мемориален комплекс от 2015 година.",
      blocks: [
        {
          id: "blk-701",
          type: "image",
          mediaUrl: "/uploads/samokov-gymnasium-facade.jpg",
          mediaType: "image",
          caption:
            "Сградата на ППМГ „Константин Фотинов“ в Самоков, осветена през 1894 г. по случай 50-годишнината на българския печат.",
          alt: "Фасада на Самоковската гимназия",
          content:
            "<strong>Самоковската гимназия:</strong> През 1894 г. за 50-годишнината на „Любословие“ е осветена новата сграда на гимназията, носеща неговото име, с черен мраморен релеф на фасадата и паметен бюст в двора на училището.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "landscape",
          imageFocus: "center",
          pageSide: "left",
        },
        {
          id: "blk-702",
          type: "image",
          mediaUrl: "/uploads/samokov-fotinov-monument-2015.jpg",
          mediaType: "image",
          caption:
            "Новият мемориален комплекс на пл. „Захарий Зограф“ в Самоков (2015 г., скулптор Спас Киричев).",
          alt: "Новият паметник на Константин Фотинов в Самоков",
          content:
            "<strong>Монументът от 2015 г.:</strong> На централния площад в Самоков скулпторът Спас Киричев изгражда бронзова композиция: Фотинов на пейка със списание „Любословие“ в ръка и каменни релефи с ключови моменти от живота му.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "landscape",
          imageFocus: "center",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-8",
      slug: "bibleyski-korpus",
      title: "Слайд VIII: 4.1. Библейският корпус (1852–1858 г.)",
      subtitle:
        "Преводът на Стария завет: „Псалтир“ (1855) и „Битие“ (1857)",
      order: 8,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Между 1852 и 1858 година Фотинов превежда Стария завет за Британското библейско дружество, като издава Псалтир през 1855 и Битие през 1857 година.",
      blocks: [
        {
          id: "blk-801",
          type: "image",
          mediaUrl: "/uploads/bible-translation-tsarigrad.png",
          mediaType: "image",
          caption:
            "Факсимиле от ръкописния превод и изданията на библейските книги под егидата на Британското библейско дружество.",
          alt: "Превод на Библията от Константин Фотинов",
          content:
            "От <strong>1852 г.</strong> Фотинов е ангажиран от Британското и чуждестранно библейско дружество под надзора на д-р Илайъс Ригс за цялостен превод на Стария завет на новобългарски език от еврейския първообраз и Септуагинтата.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "center",
          pageSide: "left",
        },
        {
          id: "blk-802",
          type: "paragraph",
          content:
            "<strong>Първи старозаветни издания:</strong> Приживе в Смирна Фотинов отпечатва <em>„Псалтир или книга псалми“ (1855 г.)</em> и <em>„Битие или священное писание“ (1857 г.)</em>. Преводът бележи категоричния му обрат към живия народен български език, надмогнал църковнославянските книжовни норми.",
          align: "left",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-9",
      slug: "konchina-i-tsarigradska-bibliya",
      title: "Слайд IX: 4.2. Кончина (1858 г.) и Цариградската Библия (1871 г.)",
      subtitle:
        "Смъртта в Цариград и колективното завършване на превода",
      order: 9,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Константин Фотинов умира от туберкулоза на 28 срещу 29 ноември 1858 година в Цариград. Неговият труд е завършен в Цариградската Библия от 1871 година.",
      blocks: [
        {
          id: "blk-901",
          type: "paragraph",
          content:
            "<strong>Кончина в Цариград (1858 г.):</strong> През есента на 1858 г. Фотинов пристига в Цариград за финалната редакция на Библията. Повален от белодробна туберкулоза, умира в нощта на <strong>28 срещу 29 ноември 1858 г.</strong> Погребан е в двора на българската църква „Св. Стефан“ в Балат.",
          align: "left",
          pageSide: "left",
        },
        {
          id: "blk-902",
          type: "paragraph",
          content:
            "<strong>Цариградската Библия (1871 г.):</strong> Д-р Илайъс Ригс, Христодул Сичан-Николов, д-р Албърт Лонг и Петко Р. Славейков завършват започнатия от Фотинов труд. През 1871 г. излиза първата цялостна българска Библия, установила единния национален книжовен език.",
          align: "left",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-10",
      slug: "fotinov-v-izkustvoto",
      title: "Слайд X: 5.1. Фотинов в изобразителното изкуство и пластиката",
      subtitle:
        "Художествени портрети (Заберски, Фотев, Калъчев) и скулптурен бюст от проф. Мара Георгиева",
      order: 10,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Художествени портрети и пластични скулптури, посветени на Константин Фотинов в Бургас и София.",
      blocks: [
        {
          id: "blk-1001",
          type: "image",
          mediaUrl: "/uploads/portrait-damyan-zaberski.jpg",
          mediaType: "image",
          caption:
            "Портрет на Константин Фотинов от бургаския художник Дамян Заберски (фонд на ПГЕЕ Бургас).",
          alt: "Портрет от Дамян Заберски",
          content:
            "<strong>Живописни интерпретации:</strong> Образът на възрожденеца вдъхновява класически платна: портрета от <strong>Дамян Заберски</strong> в ПГЕЕ Бургас, картината с книга от <strong>Ари Калъчев (1939 г.)</strong> и масления портрет от <strong>Фоти Фотев</strong> (дар от випуск 2017).",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "top",
          pageSide: "left",
        },
        {
          id: "blk-1002",
          type: "image",
          mediaUrl: "/uploads/bust-mara-georgieva-sbj.jpg",
          mediaType: "image",
          caption:
            "Скулптурен бюст на Константин Фотинов от проф. Мара Георгиева (1947 г.), фоайе на СБЖ в София.",
          alt: "Бюст от проф Мара Георгиева СБЖ",
          content:
            "<strong>Скулптурен образ в СБЖ:</strong> През 1947 г. бележитата българска скулпторка <strong>проф. Мара Георгиева</strong> извайва бронзов бюст на Фотинов, поставен във фоайето на Съюза на българските журналисти в София като вечен патрон на родната преса.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "top",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-11",
      slug: "literaturna-i-uchilishtna-pamet",
      title: "Слайд XI: 5.2. Литературна и училищна памет",
      subtitle:
        "Поезия от Борис Бухчев, химнът на гимназията, Иван Вазов и плочата в Измир",
      order: 11,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Литературна и училищна памет за Константин Фотинов: химн на гимназията, поема от Борис Бухчев и плочата в Измир.",
      blocks: [
        {
          id: "blk-1101",
          type: "image",
          mediaUrl: "/uploads/hymn-manuscript-cholakova.jpg",
          mediaType: "image",
          caption:
            "Химн на гимназия „Фотинов“ — калиграфски ръкопис на Благовеста Чолакова (11 б клас).",
          alt: "Ръкопис на химна на гимназия Фотинов",
          content:
            "<strong>Училищен химн и поезия:</strong> Паметта за книжовника живее в поетичната творба на <strong>Борис Бухчев</strong> и училищния химн на гимназията, съхраняван в калиграфски ръкопис, както и във възторжените оценки на народния поет <strong>Иван Вазов</strong>.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "center",
          pageSide: "left",
        },
        {
          id: "blk-1102",
          type: "image",
          mediaUrl: "/uploads/izmir-memorial-plaque.png",
          mediaType: "image",
          caption:
            "Възпоменателна мраморна плоча с барелеф на Константин Фотинов в Измир (Смирна), Турция.",
          alt: "Паметна плоча на Фотинов в Измир",
          content:
            "<strong>Международен мемориален знак:</strong> В съвременен <strong>Измир (Смирна)</strong> е поставена възпоменателна плоча с барелеф на Фотинов, отбелязваща мястото на неговото смесено училище и печатницата, откъдето тръгва българската журналистика.",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "landscape",
          imageFocus: "center",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "slide-12",
      slug: "memorialna-topografiya-i-rodopi",
      title: "Слайд XII: 5.3. Мемориална топография и Родопи",
      subtitle:
        "Бургас, Борисовата градина, Фотинските водопади и скалите „Костенурките“",
      order: 12,
      status: "published",
      readingTimeMinutes: 3,
      narratorAudioUrl: "",
      narratorTranscript:
        "Мемориални обекти за Фотинов в София и Бургас, и природни обекти в Родопите.",
      blocks: [
        {
          id: "blk-1201",
          type: "image",
          mediaUrl: "/uploads/sofia-borisova-gradina-fotinov.jpg",
          mediaType: "image",
          caption:
            "Бюст-паметник на Константин Фотинов в Борисовата градина в София.",
          alt: "Паметник в Борисовата градина София",
          content:
            "<strong>Мемориални центрове в България:</strong> Фотинов е увековечен в Алеята на бележитите българи в София, а в Бургас — чрез ул. „Константин Фотинов“ и Професионалната гимназия по електротехника и електроника (ПГЕЕ, 1939 г.).",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "portrait",
          imageFocus: "top",
          pageSide: "left",
        },
        {
          id: "blk-1202",
          type: "image",
          mediaUrl: "/uploads/fotinovo-waterfalls-batak.jpg",
          mediaType: "image",
          caption:
            "Фотински водопади край село Фотиново (община Батак) в Западните Родопи.",
          alt: "Фотински водопади край Батак",
          content:
            "<strong>Родопска топонимия:</strong> Името му носят селата Фотиново в община Батак (с живописните водопади) и в община Кирково (със скалния феномен „Костенурките“).",
          align: "left",
          imageLayout: "float-left",
          imageSize: "medium",
          imageCrop: "landscape",
          imageFocus: "center",
          pageSide: "right",
        },
        {
          id: "blk-1203",
          type: "paragraph",
          content:
            "<strong>Съставили монографичната интерактивна книга:</strong> Стоян Калчев и Константин Караниколов (10Г клас).",
          align: "center",
          pageSide: "right",
        },
      ],
      footnotes: [],
      createdAt: "2026-11-12T20:45:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z",
    },
  ],
  media: [
    {
      id: "med-fotinov-portrait-classic",
      name: "Официален портрет на Константин Фотинов",
      filename: "fotinov-portrait-classic.png",
      url: "/uploads/fotinov-portrait-classic.png",
      type: "image",
      mimeType: "image/png",
      size: 1647563,
      category: "portraits",
      tags: ["портрет", "фотинов", "патрон", "слайд-1"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-samokov-convent-pokrov",
      name: "Девически манастир „Покров Богородичен“ в Самоков",
      filename: "samokov-convent-pokrov.jpg",
      url: "/uploads/samokov-convent-pokrov.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 104383,
      category: "monasteries",
      tags: ["самоков", "манастир", "баба-фота", "метох", "слайд-2"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-fotinov-grammar-phrasebook",
      name: "„Гръцка граматика“ и „Болгарский разговорник“",
      filename: "fotinov-grammar-phrasebook.png",
      url: "/uploads/fotinov-grammar-phrasebook.png",
      type: "image",
      mimeType: "image/png",
      size: 71029,
      category: "facsimiles",
      tags: ["граматика", "разговорник", "учебници", "смирна", "слайд-3"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-gallaudet-dusheslovie",
      name: "„Душесловие за поучение на децата“ от Томас Галаудет",
      filename: "gallaudet-dusheslovie.png",
      url: "/uploads/gallaudet-dusheslovie.png",
      type: "image",
      mimeType: "image/png",
      size: 696872,
      category: "facsimiles",
      tags: ["галаудет", "душесловие", "педагогика", "превод", "слайд-3"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-lyuboslovie-original-issue",
      name: "Списание „Любословие“ (оригинално печатно издание)",
      filename: "lyuboslovie-original-issue.jpg",
      url: "/uploads/lyuboslovie-original-issue.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 31436,
      category: "periodicals",
      tags: ["любословие", "списание", "периодика", "1844", "слайд-4"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-female-education-samokov",
      name: "„Возобразование женскаго пола“ и девическото образование",
      filename: "female-education-samokov.png",
      url: "/uploads/female-education-samokov.png",
      type: "image",
      mimeType: "image/png",
      size: 563116,
      category: "facsimiles",
      tags: ["образование", "девическа-гимназия", "еманципация", "слайд-4"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-samokov-museum-exhibition",
      name: "Експозиция в Исторически музей – Самоков",
      filename: "samokov-museum-exhibition.jpg",
      url: "/uploads/samokov-museum-exhibition.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 115999,
      category: "museums",
      tags: ["музей", "самоков", "експозиция", "слайд-6"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-belyova-church-samokov",
      name: "Бельова църква край Самоков",
      filename: "belyova-church-samokov.jpg",
      url: "/uploads/belyova-church-samokov.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 98155,
      category: "monuments",
      tags: ["бельова-църква", "самоков", "възраждане", "слайд-6"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-samokov-gymnasium-facade",
      name: "Фасада на Самоковската гимназия с мраморния релеф от 1894 г.",
      filename: "samokov-gymnasium-facade.jpg",
      url: "/uploads/samokov-gymnasium-facade.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 164245,
      category: "monuments",
      tags: ["гимназия", "самоков", "релеф", "1894", "слайд-7"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-samokov-fotinov-monument-2015",
      name: "Мемориален комплекс на пл. „Захарий Зограф“ в Самоков (2015 г.)",
      filename: "samokov-fotinov-monument-2015.jpg",
      url: "/uploads/samokov-fotinov-monument-2015.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 86965,
      category: "monuments",
      tags: ["паметник", "самоков", "2015", "киричев", "слайд-7"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-bible-translation-tsarigrad",
      name: "Факсимиле от Цариградската Библия",
      filename: "bible-translation-tsarigrad.png",
      url: "/uploads/bible-translation-tsarigrad.png",
      type: "image",
      mimeType: "image/png",
      size: 25170,
      category: "facsimiles",
      tags: ["библия", "цариград", "ригс", "славейков", "слайд-8"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-portrait-damyan-zaberski",
      name: "Портрет на Константин Фотинов от Дамян Заберски",
      filename: "portrait-damyan-zaberski.jpg",
      url: "/uploads/portrait-damyan-zaberski.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 292012,
      category: "art",
      tags: ["портрет", "заберски", "бургас", "пгее", "слайд-10"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-bust-mara-georgieva-sbj",
      name: "Скулптурен бюст от проф. Мара Георгиева (СБЖ)",
      filename: "bust-mara-georgieva-sbj.jpg",
      url: "/uploads/bust-mara-georgieva-sbj.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 106495,
      category: "sculpture",
      tags: ["бюст", "мара-георгиева", "сбж", "софия", "слайд-10"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-portrait-ari-kalachev",
      name: "Портрет с книга от Ари Калъчев (1939 г.)",
      filename: "portrait-ari-kalachev-1939.png",
      url: "/uploads/portrait-ari-kalachev-1939.png",
      type: "image",
      mimeType: "image/png",
      size: 398430,
      category: "art",
      tags: ["портрет", "калъчев", "1939", "самоков", "слайд-10"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-portrait-foti-fotev",
      name: "Портрет на Константин Фотинов от Фоти Фотев (2017 г.)",
      filename: "portrait-foti-fotev.png",
      url: "/uploads/portrait-foti-fotev.png",
      type: "image",
      mimeType: "image/png",
      size: 800699,
      category: "art",
      tags: ["портрет", "фоти-фотев", "пгее", "бургас", "слайд-10"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-hymn-manuscript-cholakova",
      name: "Химн на гимназия „Фотинов“ — ръкопис на Благовеста Чолакова",
      filename: "hymn-manuscript-cholakova.jpg",
      url: "/uploads/hymn-manuscript-cholakova.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 487876,
      category: "archive",
      tags: ["химн", "ръкопис", "гимназия", "бухчев", "слайд-11"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-izmir-memorial-plaque",
      name: "Възпоменателна плоча в Измир (Смирна)",
      filename: "izmir-memorial-plaque.png",
      url: "/uploads/izmir-memorial-plaque.png",
      type: "image",
      mimeType: "image/png",
      size: 655658,
      category: "monuments",
      tags: ["паметна-плоча", "измир", "смирна", "турция", "слайд-11"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-sofia-borisova-gradina-fotinov",
      name: "Паметник на Константин Фотинов в Борисовата градина (София)",
      filename: "sofia-borisova-gradina-fotinov.jpg",
      url: "/uploads/sofia-borisova-gradina-fotinov.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 229908,
      category: "monuments",
      tags: ["паметник", "софия", "борисова-градина", "будители", "слайд-12"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-fotinovo-waterfalls-batak",
      name: "Фотински водопади край с. Фотиново (Батак)",
      filename: "fotinovo-waterfalls-batak.jpg",
      url: "/uploads/fotinovo-waterfalls-batak.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 91305,
      category: "nature",
      tags: ["родопи", "водопади", "фотиново", "батак", "природа", "слайд-12"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-burgas-pgee-fotinov-street",
      name: "ПГЕЕ „Константин Фотинов“ и ул. „Фотинов“ в Бургас",
      filename: "burgas-pgee-fotinov-street.jpg",
      url: "/uploads/burgas-pgee-fotinov-street.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 129183,
      category: "institutions",
      tags: ["бургас", "пгее", "улица", "патрон", "слайд-12"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-fotinovo-rock-turtles-kirkovo",
      name: "Скален комплекс „Костенурките“ край с. Фотиново (Кирково)",
      filename: "fotinovo-rock-turtles-kirkovo.jpg",
      url: "/uploads/fotinovo-rock-turtles-kirkovo.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 106467,
      category: "nature",
      tags: ["родопи", "костенурките", "скали", "фотиново", "кирково", "слайд-12"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-samokov-fotinov-bust-gymnasium",
      name: "Бюст-паметник на Фотинов в двора на Самоковската гимназия",
      filename: "samokov-fotinov-bust-gymnasium.jpg",
      url: "/uploads/samokov-fotinov-bust-gymnasium.jpg",
      type: "image",
      mimeType: "image/jpeg",
      size: 88820,
      category: "monuments",
      tags: ["бюст", "паметник", "двор", "гимназия", "самоков"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
    {
      id: "med-samokov-engraving-old",
      name: "Историческа гравюра на Възрожденски Самоков",
      filename: "samokov-engraving-old.png",
      url: "/uploads/samokov-engraving-old.png",
      type: "image",
      mimeType: "image/png",
      size: 498460,
      category: "archive",
      tags: ["гравюра", "самоков", "възраждане", "история"],
      uploadedAt: "2026-11-12T20:45:00.000Z",
    },
  ],
};

function ensureDirectoriesAndSeed() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Create historical SVG illustrations in public/uploads if they don't exist
  const portraitPath = path.join(UPLOADS_DIR, "fotinov-portrait.svg");
  if (!fs.existsSync(portraitPath)) {
    fs.writeFileSync(
      portraitPath,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#efe3c8"/>
  <rect x="20" y="20" width="760" height="460" fill="none" stroke="#5a381e" stroke-width="4"/>
  <rect x="30" y="30" width="740" height="440" fill="none" stroke="#8c6239" stroke-width="1.5" stroke-dasharray="8 4"/>
  <ellipse cx="400" cy="215" rx="135" ry="165" fill="#e2cfa9" stroke="#5a381e" stroke-width="3"/>
  <!-- Stylized Historical Bust Silhouette -->
  <circle cx="400" cy="170" r="52" fill="#5a381e" opacity="0.85"/>
  <path d="M 315 325 C 315 245, 485 245, 485 325 Z" fill="#3d2512" opacity="0.9"/>
  <path d="M 375 235 L 400 285 L 425 235 Z" fill="#f7efde"/>
  <text x="400" y="418" text-anchor="middle" fill="#3d2512" font-family="Georgia, serif" font-size="24" font-weight="bold">КОНСТАНТИН Г. ФОТИНОВ (1790 – 1858)</text>
  <text x="400" y="446" text-anchor="middle" fill="#6b4423" font-family="Georgia, serif" font-size="15" font-style="italic">Възрожденски просветител и създател на сп. „Любословие“</text>
</svg>`
    );
  }

  const lyubosloviePath = path.join(UPLOADS_DIR, "lyuboslovie-1844.svg");
  if (!fs.existsSync(lyubosloviePath)) {
    fs.writeFileSync(
      lyubosloviePath,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#e8d8b8"/>
  <rect x="190" y="25" width="420" height="450" fill="#f6ecd4" stroke="#4a2e16" stroke-width="3"/>
  <rect x="205" y="40" width="390" height="420" fill="none" stroke="#7a5230" stroke-width="1.5"/>
  <text x="400" y="105" text-anchor="middle" fill="#2b1d0e" font-family="Georgia, serif" font-size="36" font-weight="bold" letter-spacing="4">ЛЮБОСЛОВИЕ</text>
  <text x="400" y="140" text-anchor="middle" fill="#5a381e" font-family="Georgia, serif" font-size="15" font-style="italic">или периодическо повсемесячно списание</text>
  <line x1="250" y1="162" x2="550" y2="162" stroke="#5a381e" stroke-width="2"/>
  <circle cx="400" cy="255" r="58" fill="none" stroke="#5a381e" stroke-width="2"/>
  <text x="400" y="250" text-anchor="middle" fill="#5a381e" font-family="Georgia, serif" font-size="14" font-weight="bold">СМИРНА</text>
  <text x="400" y="272" text-anchor="middle" fill="#5a381e" font-family="Georgia, serif" font-size="18" font-weight="bold">1844</text>
  <line x1="250" y1="345" x2="550" y2="345" stroke="#5a381e" stroke-width="1.5"/>
  <text x="400" y="382" text-anchor="middle" fill="#3d2512" font-family="Georgia, serif" font-size="15">Издава се от К. Г. Фотинова</text>
  <text x="400" y="415" text-anchor="middle" fill="#6b4423" font-family="Georgia, serif" font-size="13" font-style="italic">В типографии А. Дамианова</text>
</svg>`
    );
  }

  const house1Path = path.join(UPLOADS_DIR, "samokov-house-1.svg");
  if (!fs.existsSync(house1Path)) {
    fs.writeFileSync(
      house1Path,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#efe4ce"/>
  <rect x="20" y="20" width="760" height="460" fill="none" stroke="#5a381e" stroke-width="3"/>
  <!-- Revival Architecture House Illustration -->
  <polygon points="160,190 400,85 640,190" fill="#6b3e26" stroke="#3d2512" stroke-width="3"/>
  <rect x="190" y="190" width="420" height="190" fill="#f7efde" stroke="#3d2512" stroke-width="3"/>
  <line x1="190" y1="285" x2="610" y2="285" stroke="#5a381e" stroke-width="4"/>
  <!-- Windows & Wooden Columns -->
  <rect x="235" y="210" width="48" height="55" fill="#d8c39e" stroke="#3d2512" stroke-width="2"/>
  <rect x="315" y="210" width="48" height="55" fill="#d8c39e" stroke="#3d2512" stroke-width="2"/>
  <rect x="435" y="210" width="48" height="55" fill="#d8c39e" stroke="#3d2512" stroke-width="2"/>
  <rect x="515" y="210" width="48" height="55" fill="#d8c39e" stroke="#3d2512" stroke-width="2"/>
  <!-- Arched Door -->
  <path d="M 370 380 L 370 315 A 30 30 0 0 1 430 315 L 430 380 Z" fill="#5a381e"/>
  <text x="400" y="425" text-anchor="middle" fill="#2b1d0e" font-family="Georgia, serif" font-size="22" font-weight="bold">КЪЩАТА НА КОНСТАНТИН ФОТИНОВ В САМОКОВ</text>
  <text x="400" y="452" text-anchor="middle" fill="#6b4423" font-family="Georgia, serif" font-size="14" font-style="italic">Възрожденски архитектурен паметник (Можете да качите ваша снимка в /data)</text>
</svg>`
    );
  }

  const house2Path = path.join(UPLOADS_DIR, "samokov-house-2.svg");
  if (!fs.existsSync(house2Path)) {
    fs.writeFileSync(
      house2Path,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#eadbc0"/>
  <rect x="20" y="20" width="760" height="460" fill="none" stroke="#5a381e" stroke-width="3"/>
  <!-- Courtyard & Veranda (Chardak) -->
  <rect x="140" y="130" width="520" height="240" fill="#f5ebd6" stroke="#4a2e16" stroke-width="3"/>
  <polygon points="120,130 400,65 680,130" fill="#5a3518" stroke="#3d2512" stroke-width="3"/>
  <line x1="250" y1="130" x2="250" y2="370" stroke="#5a3518" stroke-width="6"/>
  <line x1="400" y1="130" x2="400" y2="370" stroke="#5a3518" stroke-width="6"/>
  <line x1="550" y1="130" x2="550" y2="370" stroke="#5a3518" stroke-width="6"/>
  <line x1="140" y1="250" x2="660" y2="250" stroke="#5a3518" stroke-width="5"/>
  <text x="400" y="422" text-anchor="middle" fill="#2b1d0e" font-family="Georgia, serif" font-size="21" font-weight="bold">ЧАРДАКЪТ И ДВОРЪТ В САМОКОВ</text>
  <text x="400" y="448" text-anchor="middle" fill="#6b4423" font-family="Georgia, serif" font-size="14" font-style="italic">Родното място и метохът на баба Фота в град Самоков</text>
</svg>`
    );
  }

  const biblePath = path.join(UPLOADS_DIR, "fotinov-bible-1858.svg");
  if (!fs.existsSync(biblePath)) {
    fs.writeFileSync(
      biblePath,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#e8d8b8"/>
  <rect x="20" y="20" width="760" height="460" fill="none" stroke="#5a381e" stroke-width="3"/>
  <!-- Open Manuscript Book -->
  <path d="M 180 120 Q 290 105 400 130 Q 510 105 620 120 L 620 350 Q 510 335 400 360 Q 290 335 180 350 Z" fill="#fbf5e8" stroke="#4a2e16" stroke-width="3"/>
  <line x1="400" y1="130" x2="400" y2="360" stroke="#4a2e16" stroke-width="2.5"/>
  <text x="290" y="190" text-anchor="middle" fill="#3d2512" font-family="Georgia, serif" font-size="16" font-weight="bold">БИБЛИЯ</text>
  <text x="290" y="220" text-anchor="middle" fill="#5a381e" font-family="Georgia, serif" font-size="13">Псалтир (1855)</text>
  <text x="290" y="245" text-anchor="middle" fill="#5a381e" font-family="Georgia, serif" font-size="13">Битие (1857)</text>
  <text x="510" y="190" text-anchor="middle" fill="#3d2512" font-family="Georgia, serif" font-size="16" font-weight="bold">ЦАРИГРАД</text>
  <text x="510" y="220" text-anchor="middle" fill="#5a381e" font-family="Georgia, serif" font-size="14">29 ноември 1858 г.</text>
  <text x="510" y="248" text-anchor="middle" fill="#6b4423" font-family="Georgia, serif" font-size="12" font-style="italic">Последен книжовен завет</text>
  <text x="400" y="420" text-anchor="middle" fill="#2b1d0e" font-family="Georgia, serif" font-size="22" font-weight="bold">КНИЖОВНОТО НАСЛЕДСТВО ПРЕДИ СМЪРТТА МУ</text>
  <text x="400" y="448" text-anchor="middle" fill="#6b4423" font-family="Georgia, serif" font-size="14" font-style="italic">Преводът на Светото писание на новобългарски език и „Общое землеописание“</text>
</svg>`
    );
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_SEED, null, 2), "utf-8");
  }
}

export function readDb(): DatabaseSchema {
  ensureDirectoriesAndSeed();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    // Automatically migrate if old English seed was cached on disk
    if (parsed.bookTitle === "The Clockwork Observatory") {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_SEED, null, 2), "utf-8");
      return INITIAL_SEED;
    }
    // Never allow 0 chapters in the database (prevents undefined chapter crash)
    if (!Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
      parsed.chapters = INITIAL_SEED.chapters;
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }
    return parsed;
  } catch {
    return INITIAL_SEED;
  }
}

export function resetChaptersToDefaultSeed(): Chapter[] {
  const db = readDb();
  db.chapters = INITIAL_SEED.chapters;
  writeDb(db);
  return db.chapters;
}

export function clearAllChaptersToBlank(): Chapter[] {
  const db = readDb();
  const now = new Date().toISOString();
  db.chapters = [
    {
      id: `slide-${Date.now()}`,
      slug: "stranitsa-1",
      title: "",
      subtitle: "",
      order: 1,
      status: "published",
      readingTimeMinutes: 1,
      narratorAudioUrl: "",
      narratorTranscript: "",
      blocks: [],
      footnotes: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
  writeDb(db);
  return db.chapters;
}

export function writeDb(data: DatabaseSchema): void {
  ensureDirectoriesAndSeed();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function getChapters(includeDrafts = true): Chapter[] {
  const db = readDb();
  const chapters = db.chapters.sort((a, b) => a.order - b.order);
  return includeDrafts
    ? chapters
    : chapters.filter((c) => c.status === "published");
}

export function getChapterBySlug(slug: string): Chapter | undefined {
  const db = readDb();
  return db.chapters.find((c) => c.slug === slug);
}

export function saveChapter(chapterInput: Partial<Chapter> & { slug: string }): Chapter {
  const db = readDb();
  const existingIdx = db.chapters.findIndex(
    (c) => c.id === chapterInput.id || c.slug === chapterInput.slug
  );

  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    const existing = db.chapters[existingIdx];
    const updated: Chapter = {
      ...existing,
      ...chapterInput,
      blocks: chapterInput.blocks ?? existing.blocks,
      footnotes: chapterInput.footnotes ?? existing.footnotes,
      updatedAt: now,
    };
    db.chapters[existingIdx] = updated;
    writeDb(db);
    return updated;
  } else {
    const created: Chapter = {
      id: chapterInput.id || `slide-${Date.now()}`,
      slug: chapterInput.slug,
      title: chapterInput.title ?? "",
      subtitle: chapterInput.subtitle ?? "",
      order: chapterInput.order ?? db.chapters.length + 1,
      status: chapterInput.status || "published",
      readingTimeMinutes: chapterInput.readingTimeMinutes || 3,
      narratorAudioUrl: chapterInput.narratorAudioUrl || "",
      narratorTranscript: chapterInput.narratorTranscript || "",
      unlockCondition: chapterInput.unlockCondition || "",
      blocks: chapterInput.blocks ?? [],
      footnotes: chapterInput.footnotes ?? [],
      createdAt: now,
      updatedAt: now,
    };
    db.chapters.push(created);
    writeDb(db);
    return created;
  }
}

export function deleteChapterBySlug(slug: string): boolean {
  const db = readDb();
  const prevLen = db.chapters.length;
  db.chapters = db.chapters.filter((c) => c.slug !== slug);
  if (db.chapters.length !== prevLen) {
    // If the user deleted the last remaining page, keep 1 completely blank page so the book never crashes
    if (db.chapters.length === 0) {
      const now = new Date().toISOString();
      db.chapters = [
        {
          id: `slide-${Date.now()}`,
          slug: "stranitsa-1",
          title: "",
          subtitle: "",
          order: 1,
          status: "published",
          readingTimeMinutes: 1,
          narratorAudioUrl: "",
          narratorTranscript: "",
          blocks: [],
          footnotes: [],
          createdAt: now,
          updatedAt: now,
        },
      ];
    }
    writeDb(db);
    return true;
  }
  return false;
}

export function getMediaItems(): MediaItem[] {
  const db = readDb();
  return db.media.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export function addMediaItem(item: MediaItem): MediaItem {
  const db = readDb();
  db.media.unshift(item);
  writeDb(db);
  return item;
}

export function updateMediaItem(
  id: string,
  patch: Partial<Pick<MediaItem, "name" | "category" | "tags">>
): MediaItem | null {
  const db = readDb();
  const idx = db.media.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.media[idx] = { ...db.media[idx], ...patch };
  writeDb(db);
  return db.media[idx];
}

export function deleteMediaItem(id: string): boolean {
  const db = readDb();
  const item = db.media.find((m) => m.id === id);
  if (!item) return false;

  const filePath = path.join(process.cwd(), "public", item.url);
  if (fs.existsSync(filePath) && filePath.startsWith(UPLOADS_DIR)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore unlink error
    }
  }

  db.media = db.media.filter((m) => m.id !== id);
  writeDb(db);
  return true;
}
