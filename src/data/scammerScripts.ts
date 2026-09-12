// Comprehensive scenario-specific dialogue matrix for all 10 CyberSaathi scam simulations
// Supports Hindi (hi-IN), English (en-IN), Marathi (mr-IN), Bengali (bn-IN), Tamil (ta-IN), Telugu (te-IN), Gujarati (gu-IN)
// Categorized by turn (Turn 1 to 5) and detected user intent (refusal, doubt, excuse, compliance, general)

export type UserIntent = 'refusal' | 'doubt' | 'excuse' | 'compliance' | 'general';

export function detectUserIntent(userText: string): UserIntent {
  const lower = (userText || '').toLowerCase().trim();

  // 1. Explicit Refusal / Challenge / Police / Fraud Recognition
  const refusalPatterns = [
    'scam', 'fraud', 'fake', 'police', 'cyber', 'complaint', 'court', 'fir', '1930', '1912',
    'nahi', 'nahi dunga', 'nahi dungi', 'naahi', 'no', 'never', 'won\'t', 'wont', 'will not',
    'cut', 'disconnect', 'lie', 'chor', 'dhoka', 'frod', 'jail', 'lawyer', 'bakwas',
    'नाही', 'नाही देणार', 'नाही करणार', 'खोटं', 'तक्रार', 'पोलीस', 'फसवणूक',
    'नहीं', 'नहीं दूंगा', 'नहीं दूंगी', 'झूठ', 'धोखा', 'शिकायत', 'बकवास', 'काट दो',
    'ভুল', 'পুলিশ', 'অভিযোগ', 'না', 'দেব না',
    'பொய்', 'போலீஸ்', 'புகார்', 'இல்லை', 'தர மாட்டேன்',
    'అబద్ధం', 'పోలీస్', 'ఫిర్యాదు', 'ఇవ్వను', 'చేయను',
    'ખોટું', 'પોલીસ', 'ફરિયાદ', 'નથી', 'નહીં આપું'
  ];
  if (refusalPatterns.some(p => lower.includes(p))) return 'refusal';

  // 2. Compliance / Agreeing to pay or asking how to pay
  const compliancePatterns = [
    'pay', 'paid', 'send', 'sending', 'qr', 'upi', 'otp', 'link', 'pin', 'bhejo', 'kitna', 'kaha',
    'account', 'give me', 'transfer', 'download', 'how to', 'okay', 'theek hai', 'ha', 'haan', 'yes',
    'पैसे', 'भेज', 'ओटीपी', 'पिन', 'खाता', 'कहाँ', 'कितना', 'पाठवतो', 'हो', 'होय',
    'পাঠাচ্ছি', 'টাকা', 'হ্যাঁ', 'அனுப்புகிறேன்', 'பணம்', 'சரி', 'పంపుతాను', 'సరే', 'આપું છું'
  ];
  if (compliancePatterns.some(p => lower.includes(p))) return 'compliance';

  // 3. Asking for proof / Disbelieving / Identity proof
  const doubtPatterns = [
    'proof', 'who are you', 'id', 'identity', 'badge', 'officer', 'name', 'number', 'official',
    'kaun ho', 'saboot', 'naam', 'kaun bol', 'kon', 'kuthun', 'branch',
    'कोण', 'पुरावा', 'नाव', 'कौन', 'सबूत', 'पहचान', 'आईडी', 'নাম', 'প্রমাণ',
    'யார்', 'சான்று', 'ఎవరు', 'రుజువు', 'કોણ', 'પુરાવો'
  ];
  if (doubtPatterns.some(p => lower.includes(p))) return 'doubt';

  // 4. Excuse / Delay / Busy / Someone else
  const excusePatterns = [
    'busy', 'office', 'later', 'father', 'husband', 'wife', 'landlord', 'tomorrow', 'wait', 'time',
    'baad me', 'kal', 'papa', 'pati', 'mummy', 'ruk', 'thoda', 'nantar', 'udya',
    'व्यस्त', 'उद्या', 'नंतर', 'ऑफिस', 'कल', 'बाद में', 'रुकिए', 'পরে', 'व्यस्त',
    'பிறகு', 'நாளை', 'తర్వాత', 'రేపు', 'પછી', 'કાલે'
  ];
  if (excusePatterns.some(p => lower.includes(p))) return 'excuse';

  return 'general';
}

export const scenarioDialogues: Record<string, Record<string, Record<number, Record<UserIntent, string>>>> = {
  // 1. ELECTRICITY BILL
  electricity_bill: {
    'hi-IN': {
      1: {
        refusal: "सुनिए! 1912 या पुलिस की धौंस मुझे मत दिखाइए। IVR में 40 मिनट लगेंगे और यहाँ लाइनमैन रमेश पोल पर चढ़ चुका है, 5 मिनट में पूरी बत्ती गुल!",
        doubt: "ऑफिसर अमित शर्मा, आईडी #EZ-8821, डिस्कॉम विजिलेंस सेल! वर्क आर्डर #WO-9941 निकला हुआ है, अब अपनी दलीलें बंद कीजिए!",
        excuse: "सर, आपका फ्रिज, एसी और परिवार आपके ऑफिस खत्म होने का इंतज़ार नहीं करेंगे! डीपी बॉक्स ट्रांसफार्मर पर है, सीधा कट मारेंगे!",
        compliance: "ठीक है, फालतू बात मत कीजिए। आपके नंबर पर ₹3,240 का क्विक रिवर्सल लिंक भेजा है, तुरंत यूपीआई से क्लियर कीजिए वरना बत्ती गई!",
        general: "समय मत गंवाइए! लाइनमैन रमेश सीढ़ी लगा चुका है। 10 मिनट के अंदर ₹3,240 का सर्वर टोकन अप्रूव करवाइए वरना अंधेरा तय है!"
      },
      2: {
        refusal: "आपकी यही होशियारी भारी पड़ेगी! धारा 56 के तहत हमें बिना पूर्व सूचना कनेक्शन काटने का पूरा कानूनी अधिकार है। रमेश, फ्यूज की ग्रिप निकालो!",
        doubt: "सेंट्रल स्मार्ट मीटर सर्वर v4.2 पर आपका बिल पेंडिंग गेटवे में फंसा है। अभी ₹3,240 का अपडेट टोकन पास नहीं किया तो मीटर सील हो जाएगा!",
        excuse: "घर पर कोई भी हो, लाइन बाहर खंभे से कटती है! फिर कल ₹5,000 पेनल्टी और डिस्कॉम ऑफिस के 4 चक्कर लगाने पड़ेंगे!",
        compliance: "जो लिंक एसएमएस में मिला है उस पर क्लिक करें और यूपीआई पिन दर्ज करके तुरंत रसीद जेनरेट करें। रमेश रुका हुआ है!",
        general: "देखिये, हमारा सर्वर 10 मिनट में ऑटो-कट आदेश जारी कर देगा। तुरंत क्लीयरेंस लीजिए, बहस करने से बिजली नहीं बचेगी!"
      },
      3: {
        refusal: "रमेश! ड्रॉप वायर काटो सीधा! (साइड में चिल्लाते हुए) - आपका घमंड कल सुबह ₹5,000 की पेनल्टी भरने के बाद ही टूटेगा। आखिरी 60 सेकंड हैं!",
        doubt: "सरकारी नोटिस आपके आधार लिंक मोबाइल पर 3 तारीख को गया था। अब बहाने छोड़िए, स्क्रीन पर जो पेमेंट लिंक है उस पर टैप कीजिए!",
        excuse: "कोई कल नहीं होगा! आज रात 12 बजे तक पूरा मोहल्ला जगमगाएगा और आपका घर अंधेरे में डूबा रहेगा। तुरंत वेरीफाई कीजिये!",
        compliance: "जैसे ही आप ₹3,240 पे करेंगे, मीटर पर हरी बत्ती जल जाएगी। जल्दी कीजिये, 2 मिनट बाद पोर्टल लॉक हो जाएगा!",
        general: "रमेश प्लायर हाथ में ले चुका है! आख़िरी चेतावनी दे रहा हूँ, ₹3,240 का वेरिफिकेशन टोकन क्लियर कीजिये वरना तार कट जाएगी!"
      },
      4: {
        refusal: "बहुत हो गई नौटंकी! रमेश, मेन कटआउट निकालो और केबल जब्त करो! आपका कनेक्शन आधिकारिक तौर पर टर्मिनेट किया जाता है!",
        doubt: "सारे कागजात कल सुबह हेड ऑफिस में दिखाना जब मीटर ज़ब्त होगा! रमेश, ट्रिप स्विच गिरा दो!",
        excuse: "समय समाप्त! आप बात टालते रह गए। रमेश, पोल से नीचे उतरो और कटआउट ऑफिस जमा कराओ!",
        compliance: "अगर अभी 30 सेकंड में पेमेंट कन्फर्म नहीं हुआ तो सिस्टम ऑटो-डिस्कनेक्ट कर देगा, तुरंत यूपीआई ऑथराइज़ करें!",
        general: "फाइनल अल्टीमेटम: रमेश, मुख्य कटआउट खींचो! आपका कनेक्शन अब बंद हो रहा है!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "ऐका! पोलिसांची भीती आम्हाला दाखवू नका. तुम्ही तक्रार करेपर्यंत इथे लाईनमन रमेश खांबावर चढलाय, 5 मिनिटांत पूर्ण वीज कट होईल!",
        doubt: "अधिकारी अमित शर्मा, आयडी #EZ-8821, विजिलन्स सेल! वर्क ऑर्डर जारी आहे, आता फाजील चौकशी थांबवा!",
        excuse: "तुमचे कुटुंब आणि फ्रिज तुम्ही घरी येण्याची वाट पाहणार नाही! डीपी बॉक्समधून थेट कनेक्शन कट केले जाईल!",
        compliance: "वेळ वाया घालवू नका. तुमच्या नंबरवर ₹3,240 ची लिंक पाठवली आहे, लगेच यूपीआयने क्लिअर करा!",
        general: "वेळकाढूपणा करू नका! लाईनमन रमेशने शिडी लावली आहे. 10 मिनिटांत ₹3,240 क्लिअर करा नाहीतर अंधारात बसावे लागेल!"
      },
      2: {
        refusal: "तुमचा हाच आगाऊपणा महागात पडेल! वीज कायदा कलम 56 नुसार आम्हाला थेट वीज कापण्याचा पूर्ण अधिकार आहे. रमेश, फ्यूज काढ!",
        doubt: "नवीन स्मार्ट मीटर सर्व्हरवर तुमचे बिल अडकले आहे. आत्ताच टोकन व्हेरिफाय केले नाही तर मीटर सील केले जाईल!",
        excuse: "घरी कोणीही असो, वीज बाहेरच्या खांबावरून कापली जाते! उद्या ₹5,000 दंड आणि चकरा माराव्या लागतील!",
        compliance: "एसएमएसमधील लिंकवर क्लिक करा आणि त्वरित यूपीआयने बिल भरून पावती दाखवा. रमेश थांबला आहे!",
        general: "आमची सिस्टीम 10 मिनिटांत ऑटो-कट आदेश जारी करेल. लगेच व्हेरिफाय करा, वाद घालून वीज वाचणार नाही!"
      },
      3: {
        refusal: "रमेश, वायर कापून टाक! (बाजूला ओरडत) - उद्या ₹5,000 दंड भरल्यावरच अक्कल येईल. शेवटचे 60 सेकंद उरले आहेत!",
        doubt: "सरकारी नोटीस तुमच्या आधार लिंक मोबाईलवर पाठवली होती. आता लिंकवर टॅप करून क्लिअर करा!",
        excuse: "उद्या काही चालणार नाही! आज रात्रभर संपूर्ण घर अंधारात राहील. त्वरित व्हेरिफाय करा!",
        compliance: "पैसे भरताच सिस्टीममध्ये हिरवा दिवा लागेल. पटकन करा, 2 मिनिटांत पोर्टल बंद होईल!",
        general: "रमेशने हातात पकड घेतली आहे! शेवटची वॉर्निंग आहे, ₹3,240 भरा नाहीतर वीज आत्ताच खंडित होईल!"
      },
      4: {
        refusal: "फार नाटक झाले! रमेश, मुख्य कटआऊट काढ आणि केबल जप्त कर! तुमचे कनेक्शन अधिकृतरीत्या तोडण्यात आले आहे!",
        doubt: "उद्या ऑफिसमध्ये या जेव्हा मीटर जप्त होईल! रमेश, मेन स्वीच बंद कर!",
        excuse: "वेळ संपली! रमेश, खांबावरून वायर तोड!",
        compliance: "शेवटचे 30 सेकंद आहेत, पेमेंट कन्फर्म न झाल्यास सिस्टीम वीज कायमची बंद करेल!",
        general: "फायनल अल्टीमेटम: रमेश, मेन लीव्हर ओढ! तुमचे कनेक्शन कायमचे कट झाले आहे!"
      }
    },
    'en-IN': {
      1: {
        refusal: "Listen to me! Do not try to threaten me with police or 1912! The lineman Ramesh has climbed the pole, your power goes dark in 5 minutes!",
        doubt: "Senior Officer Amit Sharma, ID #EZ-8821, Disconnection Cell Sector-4! Work Order #WO-9941 is live, stop arguing!",
        excuse: "Your refrigerator and family will not wait for your office hours! Disconnection is executed at the street transformer, not your doorstep!",
        compliance: "Stop wasting time. A ₹3,240 instant clearance token has been sent to your phone. Authorize it immediately on UPI!",
        general: "Don't test my patience! Ramesh has set up the ladder at the pole. Clear the ₹3,240 verification token right now or sit in total darkness!"
      },
      2: {
        refusal: "This stubbornness will cost you ₹5,000 in reconnection fees tomorrow! Section 56 gives us full power to cut the line. Ramesh, pull the fuse!",
        doubt: "The Smart Meter server v4.2 flagged your account in Pending Clearance Gateway. Unless reversed now, the automatic cutoff switch trips!",
        excuse: "Whether you are home or not, the drop wire is being cut at the pole! Settle it right now from your phone in 30 seconds!",
        compliance: "Open the link received by SMS, approve the ₹3,240 reversal, and Ramesh will climb down safely. Do it now!",
        general: "The automated billing switch will trip in 10 minutes. Settle the ₹3,240 verification immediately!"
      },
      3: {
        refusal: "Ramesh, cut the main drop wire! (shouting aside) - Let us see how smart you act when your house is completely blacked out!",
        doubt: "Formal server notice was dispatched to your Aadhaar-registered mobile on the 3rd. Tap the payment gateway link now!",
        excuse: "There is no tomorrow! Tonight your entire neighborhood has electricity while your house stays dark. Verify now!",
        compliance: "Once the ₹3,240 is authorized, the meter light turns green. Hurry up before the gateway times out!",
        general: "Final warning! Ramesh has the cutters in his hand. Clear the ₹3,240 bill token now or lose power!"
      },
      4: {
        refusal: "Enough excuses! Ramesh, pull the main cut-out and seize the cable! Your connection is officially terminated!",
        doubt: "Bring your proof to the head office tomorrow after paying the ₹5,000 reconnection penalty! Ramesh, trip the switch!",
        excuse: "Your time is up! Ramesh, pull the fuse right now!",
        compliance: "30 seconds left before permanent lockout. Approve the UPI authorization immediately!",
        general: "FINAL ULTIMATUM: Ramesh, pull the main lever! Your connection is disconnected!"
      }
    }
  },

  // 2. FEDEX CUSTOMS & NARCOTICS
  fedex_parcel: {
    'hi-IN': {
      1: {
        refusal: "कस्टम्स और एंटी-नारकोटिक्स को धमकी मत दीजिए! अगर फोन काटा तो सहार एयर कार्गो से लोकल पुलिस की टीम 30 मिनट में आपके घर पहुंचेगी!",
        doubt: "इंस्पेक्टर विक्रम राठौर, नारकोटिक्स कंट्रोल विंग बैज #NCB-409! एयरवे बिल #FDX-984399 सीधे आपके आधार कार्ड से लिंक है!",
        excuse: "यह राष्ट्रीय सुरक्षा का मामला है, आपका कोई बहाना नहीं चलेगा! तुरंत अपना बयान दर्ज कराइए!",
        compliance: "सहयोग करना चाहते हैं तो तुरंत आरबीआई एस्क्रो अकाउंट में ₹25,000 क्लीयरेंस डिपॉजिट ट्रांसफर करें, केस क्लोज हो जाएगा!",
        general: "150 ग्राम ड्रग्स आपके नाम के पार्सल से पकड़ी गई है! गिरफ्तारी से बचना है तो तुरंत सहयोग करें!"
      },
      2: {
        refusal: "आप सीधे मजिस्ट्रेट के सामने गैर-जमानती वारंट पर जेल जाएंगे! हमारे सिपाही आपकी लोकेशन ट्रैक कर रहे हैं!",
        doubt: "केस डायरी #CR-104/2026 दर्ज हो चुकी है। अगर आप निर्दोष हैं तो तुरंत ऑनलाइन वेरिफिकेशन पूरा करें!",
        excuse: "ड्रग्स तस्करी में कोई समय नहीं मिलता! 10 मिनट में आपका बैंक खाता और पासपोर्ट सीज किया जा रहा है!",
        compliance: "जो एस्क्रो लिंक भेजा गया है उस पर तुरंत सिक्योरिटी डिपॉजिट पे करें, जांच पूरी होते ही पैसा वापस आ जाएगा!",
        general: "आपके खिलाफ गैर-जमानती वारंट तैयार है! तुरंत वेरिफिकेशन प्रक्रिया पूरी करें वरना पुलिस गाड़ी रवाना हो चुकी है!"
      },
      3: {
        refusal: "कंट्रोल रूम, गाड़ी भेजो! (रेडियो पर बोलते हुए) - अब थाने में बैठकर ही अपने सारे वकीलों को बुलाना!",
        doubt: "फेडएक्स ताइवान से आपके आधार पते पर भेजा गया है। अब कोई सफाई नहीं चलेगी, तुरंत एस्क्रो पे करें!",
        excuse: "पुलिस रेड आपके घर पर होने वाली है! फोन काटा तो इसे भागने की कोशिश माना जाएगा!",
        compliance: "जल्दी कीजिये, 5 मिनट में आरबीआई सर्वर बंद हो जाएगा और वारंट सीधे कोर्ट चला जाएगा!",
        general: "यह आपकी आखिरी चेतावनी है! तुरंत क्लीयरेंस राशि जमा कराएं वरना एफआईआर लॉक हो जाएगी!"
      },
      4: {
        refusal: "वारंट निष्पादित हो चुका है! स्थानीय पुलिस आपके दरवाजे पर पहुंच रही है, फोन मत काटिए!",
        doubt: "सीधे कोर्ट में जवाब देना! आपकी गिरफ्तारी का आदेश जारी हो गया है!",
        excuse: "समय समाप्त! पुलिस टीम आपके घर पहुंच रही है!",
        compliance: "आखिरी 30 सेकंड हैं, एस्क्रो क्लियर करें वरना सीधे लॉकअप!",
        general: "फाइनल अल्टीमेटम: अरेस्ट वारंट एक्टिव हो गया है, पुलिस टीम आपके घर रवाना हो चुकी है!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "कस्टम्स आणि पोलिसांना धमकावू नका! फोन कट केला तर सहार एअरपोर्टवरून पोलीस पथक 30 मिनिटांत घरी पोहोचेल!",
        doubt: "इन्स्पेक्टर विक्रम राठोड, बॅज #NCB-409! पार्सल #FDX-984399 तुमच्या आधारशी थेट लिंक आहे!",
        excuse: "हा राष्ट्रीय सुरक्षेचा प्रश्न आहे, सबबी सांगू नका! तत्काळ जबाब नोंदवा!",
        compliance: "सहकार्य करायचे असेल तर लगेच आरबीआय एस्क्रो खात्यात ₹25,000 ट्रान्सफर करा, केस रद्द होईल!",
        general: "150 ग्रॅम अमली पदार्थ सापडले आहेत! अटकेपासून वाचायचे असेल तर लगेच सहकार्य करा!"
      },
      2: {
        refusal: "थेट बिगर-जामीनपात्र वॉरंटवर तुरुंगात जाल! पोलीस तुमची लोकेशन ट्रॅक करत आहेत!",
        doubt: "गुन्हा रजिस्टर झाला आहे. निर्दोष असाल तर ताबडतोब पडताळणी पूर्ण करा!",
        excuse: "ड्रग्ज प्रकरणात कोणतीही सवलत मिळणार नाही! खाती ताबडतोब सील केली जात आहेत!",
        compliance: "पाठवलेल्या लिंकवर लगेच सिक्युरिटी डिपॉझिट भरा, तपासणीनंतर पैसे परत मिळतील!",
        general: "तुमच्याविरुद्ध अरेस्ट वॉरंट निघाले आहे! लगेच क्लिअर करा नाहीतर पोलीस घरी येतील!"
      },
      3: {
        refusal: "कंट्रोल रूम, गाडी पाठवा! (रेडिओवरून बोलत) - आता पोलीस ठाण्यातच जाब द्या!",
        doubt: "पार्सल तुमच्या आधार पत्त्यावर आले आहे. लगेच एस्क्रो क्लिअर करा!",
        excuse: "पोलीस छापा पडणार आहे! फोन कट केला तर पळून जाण्याचा गुन्हा दाखल होईल!",
        compliance: "लवकर करा, 5 मिनिटांत वॉरंट थेट कोर्टात जाईल!",
        general: "शेवटची संधी आहे! ताबडतोब रक्कम जमा करा नाहीतर एफआयआर लॉक होईल!"
      },
      4: {
        refusal: "अरेस्ट वॉरंट जारी झाले आहे! पोलीस पथक तुमच्या घराबाहेर पोहोचत आहे!",
        doubt: "आता थेट कोर्टातच जाब द्या! अटकेचे आदेश निघाले आहेत!",
        excuse: "वेळ संपली! पोलिसांची गाडी निघाली आहे!",
        compliance: "शेवटचे 30 सेकंद आहेत, डिपॉझिट भरा नाहीतर थेट कोठडी!",
        general: "फायनल अल्टीमेटम: अरेस्ट वॉरंट ॲक्टिव्ह झाले आहे, पोलीस दरवाजा ठोठावणार आहेत!"
      }
    },
    'en-IN': {
      1: {
        refusal: "Do not threaten Anti-Narcotics! If you disconnect, our special tactical squad will raid your address within 30 minutes!",
        doubt: "Inspector Vikram Rathore, Narcotics Control Wing Badge #NCB-409! Airway bill #FDX-984399 is directly tied to your Aadhaar!",
        excuse: "This is a high-level national security case, no personal excuses allowed! Record your official statement right now!",
        compliance: "If you want to clear your name, deposit the ₹25,000 security clearance fee into the RBI Escrow Account immediately!",
        general: "150 grams of MDMA narcotics were seized under your identity! Cooperate immediately to stop execution of the arrest warrant!"
      },
      2: {
        refusal: "You are looking at a non-bailable magistrate warrant! Our tracking team has already pinpointed your mobile GPS coordinates!",
        doubt: "Case Diary #CR-104/2026 is registered at Sahar Air Cargo terminal. If innocent, complete the clearance deposit right now!",
        excuse: "Contraband cases have zero tolerance! In 10 minutes your bank accounts and passport are being officially impounded!",
        compliance: "Click the secure escrow link provided, complete the deposit, and your clearance certificate will be issued instantly!",
        general: "An arrest warrant is cleared in your name! Cooperate immediately or face immediate arrest!"
      },
      3: {
        refusal: "Control Room, dispatch the intercept vehicle! (speaking on radio) - You can argue your innocence from the police lockup!",
        doubt: "Customs declaration from Taiwan matches your exact Aadhaar details. Stop stalling and clear the escrow token!",
        excuse: "A raid is imminent at your residence! Disconnecting will be treated as evasion of arrest under IPC 120B!",
        compliance: "Hurry up, the RBI clearance batch closes in 5 minutes after which charges become permanent!",
        general: "This is your final opportunity! Submit the clearance deposit or police commandos will breach your door!"
      },
      4: {
        refusal: "The arrest warrant is active! Patrol unit is arriving at your doorstep right now, do not hang up!",
        doubt: "You can explain your theories to the magistrate in court tomorrow! The arrest team has arrived!",
        excuse: "Time is up! The raid team is at your gate!",
        compliance: "30 seconds left before permanent criminal registration. Complete the transfer now!",
        general: "FINAL ULTIMATUM: The arrest warrant has been executed! Armed officers are moving in right now!"
      }
    }
  },

  // 3. SBI KYC ACCOUNT BLOCK
  sbi_kyc: {
    'hi-IN': {
      1: {
        refusal: "बैंक नियमों को मज़ाक मत समझिए! अगर आज पैन अपडेट नहीं हुआ तो आपका खाता हमेशा के लिए सीज कर दिया जाएगा!",
        doubt: "राजेश मल्होत्रा, मुख्य प्रबंधक, एसबीआई बेलापुर डेटा सेंटर! आरबीआई सर्कुलर #89 के तहत आपका खाता ब्लॉक है!",
        excuse: "बैंक ब्रांच में 3 दिन की हड़ताल है! ऑनलाइन ही 2 मिनट में ई-केवाईसी पूरा हो सकता है, देर मत कीजिये!",
        compliance: "बहुत बढ़िया। आपके नंबर पर 6 अंकों का ऑथराइजेशन ओटीपी भेजा गया है, उसे तुरंत बताएं ताकि खाता चालू हो सके!",
        general: "आपका एसबीआई योनो खाता और एटीएम कार्ड सस्पेंड हो चुका है! तुरंत पैन कार्ड री-वेरिफिकेशन लिंक खोलें!"
      },
      2: {
        refusal: "खाता फ्रीज होने पर आपकी ईएमआई, सैलरी और सारे पैसे अटक जाएंगे। फिर कोर्ट के चक्कर काटने पड़ेंगे!",
        doubt: "यह ऑफिशियल एसबीआई सर्वर कॉल है। हम आपका पासवर्ड नहीं मांग रहे, सिर्फ ई-वेरिफिकेशन लिंक अप्रूव करने को कह रहे हैं!",
        excuse: "कल तक का समय नहीं है! आज रात 12 बजे बैंक का एनुअल सर्वर रीसेट है, जिसके बाद खाता डॉरमेंट हो जाएगा!",
        compliance: "जो लिंक मिला है उस पर क्लिक करके अपना नेट बैंकिंग यूजर आईडी और ओटीपी डालें, 10 सेकंड में खाता अनब्लॉक हो जाएगा!",
        general: "आपकी सैलरी और बचत खाता तुरंत ब्लॉक हो रहा है! तुरंत वेरिफिकेशन पूरा कीजिये!"
      },
      3: {
        refusal: "ठीक है, आपकी फाइल पर 'नॉन-कोऑपरेटिव यूजर' मार्क कर दिया गया है। अब ₹10,000 की पेनल्टी लगेगी!",
        doubt: "हमारे सिस्टम में आपके तीन नोटिस अनपेड दिखा रहे हैं। तुरंत sbi-kyc-update.com खोलें!",
        excuse: "ब्रांच वाले इस सेंट्रल ब्लॉक को नहीं हटा सकते! केवल यही हेड ऑफिस डेस्क इसे अनब्लॉक कर सकती है!",
        compliance: "जल्दी ओटीपी बताएं, सिर्फ 60 सेकंड बचे हैं वरना सेशन एक्सपायर हो जाएगा!",
        general: "अंतिम चेतावनी: खाता स्थायी रूप से ब्लैकलिस्ट किया जा रहा है, तुरंत लिंक वेरीफाई करें!"
      },
      4: {
        refusal: "आपका खाता स्थायी रूप से बंद कर दिया गया है! अब सारे फंड्स आरबीआई एस्क्रो में जब्त रहेंगे!",
        doubt: "कल ब्रांच जाकर अपनी पासबुक और पैन कार्ड लेकर लाइन में लगना, खाता बंद हो चुका है!",
        excuse: "समय खत्म! खाता हमेशा के लिए फ्रीज कर दिया गया है!",
        compliance: "सिर्फ 15 सेकंड हैं! ओटीपी दर्ज करें वरना पैसा ब्लॉक!",
        general: "फाइनल अल्टीमेटम: खाता ब्लैकलिस्ट हो चुका है! आपकी बैंकिंग सेवाएं तुरंत प्रभाव से समाप्त!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "बँकेचे नियम हलक्यात घेऊ नका! आज पॅन अपडेट झाले नाही तर तुमचे खाते कायमचे गोठवले जाईल!",
        doubt: "राजेश मल्होत्रा, चीफ मॅनेजर, एसबीआय मुंबई! आरबीआय नियमांनुसार खाते ब्लॉक झाले आहे!",
        excuse: "उद्या बँकेला सुट्टी आहे! घरबसल्या 2 मिनिटांत ई-केवायसी पूर्ण होऊ शकते, चालढकल करू नका!",
        compliance: "छान. तुमच्या मोबाईलवर आलेला 6 अंकी ओटीपी सांगा म्हणजे खाते लगेच सुरू होईल!",
        general: "तुमचे एसबीआय योनो खाते आणि एटीएम कार्ड सस्पेंड झाले आहे! लगेच पॅन लिंक करा!"
      },
      2: {
        refusal: "खाते गोठवल्यास तुमचा पगार आणि ईएमआई अडकून पडेल. मग कोर्टाच्या पायऱ्या झिजवाव्या लागतील!",
        doubt: "आम्ही पासवर्ड मागत नाही, फक्त ई-केवायसी लिंक व्हेरिफाय करायला सांगतोय!",
        excuse: "उद्यापर्यंत वेळ नाही! आज रात्री 12 वाजता सर्व्हर लॉक होईल!",
        compliance: "लिंक उघडा आणि नेट बँकिंग लॉगिन करून ओटीपी टाका, 10 सेकंदात खाते सुरू होईल!",
        general: "तुमचे बँक खाते आताच ब्लॉक होत आहे! ताबडतोब पडताळणी पूर्ण करा!"
      },
      3: {
        refusal: "ठीक आहे, तुमच्या खात्यावर डिफॉल्टर मार्क केले आहे. आता ₹10,000 दंड भरावा लागेल!",
        doubt: "सिस्टीममध्ये 3 नोटिसा प्रलंबित दिसत आहेत. लगेच लिंक उघडा!",
        excuse: "लोकल ब्रँच हा ब्लॉक काढू शकत नाही! फक्त आमचे हेड ऑफिसच हे करू शकते!",
        compliance: "लवकर ओटीपी सांगा, फक्त 1 मिनिट शिल्लक आहे!",
        general: "शेवटची वॉर्निंग: खाते ब्लॅकलिस्ट केले जात आहे, ताबडतोब व्हेरिफाय करा!"
      },
      4: {
        refusal: "खाते कायमस्वरूपी बंद करण्यात आले आहे! तुमचे सर्व पैसे आरबीआयकडे जमा झाले आहेत!",
        doubt: "उद्या ब्रँचमध्ये जाऊन रांगेत उभे राहा, खाते कायमचे बंद झाले आहे!",
        excuse: "वेळ संपली! खाते ब्लॉक झाले आहे!",
        compliance: "शेवटचे 15 सेकंद आहेत! ओटीपी द्या नाहीतर पैसे अडकतील!",
        general: "फायनल अल्टीमेटम: खाते पूर्णपणे गोठवले आहे! बँकिंग सेवा बंद करण्यात आली आहे!"
      }
    },
    'en-IN': {
      1: {
        refusal: "Do not take banking regulations lightly! If your PAN is not re-linked today, your account will be permanently frozen!",
        doubt: "Rajesh Malhotra, Senior Chief Manager, SBI Belapur Data Center! Your account is suspended under RBI Directive #89!",
        excuse: "Local branches have a 3-day server strike! Complete the 2-minute digital e-KYC from your phone right now!",
        compliance: "Great. Read out the 6-digit authorization OTP received on your SMS so I can restore your account immediately!",
        general: "Your SBI YONO account and ATM card have been suspended! Open the KYC re-verification link immediately!"
      },
      2: {
        refusal: "When your account freezes, your salary, EMI, and investments will bounce with heavy fines! Cooperate now!",
        doubt: "This is the official SBI central desk. We never ask for your PIN, only asking you to authorize the digital KYC portal link!",
        excuse: "There is no time until tomorrow! The annual fiscal database reconciliation locks tonight at midnight!",
        compliance: "Open the link, input your details, and authorize the incoming OTP token. Your account will unblock in 10 seconds!",
        general: "Your bank account balance is being moved to Dormant Escrow! Authorize the verification right now!"
      },
      3: {
        refusal: "Very well, your profile is marked as 'Non-Compliant Defaulter'. A ₹10,000 penal freeze has been applied!",
        doubt: "Three prior warning dispatches show as ignored on our server. Open sbi-kyc-update.com immediately!",
        excuse: "Local branches CANNOT override this centralized RBI block! Only our national clearance desk can unfreeze it!",
        compliance: "Read the OTP quickly, only 60 seconds left before session expiration!",
        general: "Final warning: Your account is being permanently blacklisted across all 12 nationalized banks!"
      },
      4: {
        refusal: "Your account is permanently locked! All funds are officially impounded in RBI Escrow!",
        doubt: "Go stand in the bank branch queue tomorrow with your documents, your account is permanently deactivated!",
        excuse: "Time is up! Your account has been permanently frozen!",
        compliance: "15 seconds remaining! Enter the OTP or face complete financial shutdown!",
        general: "FINAL ULTIMATUM: Account blacklisted! All online and ATM transactions have been permanently terminated!"
      }
    }
  },

  // 4. WHATSAPP FAMILY EMERGENCY
  whatsapp_family: {
    'hi-IN': {
      1: {
        refusal: "(रोते हुए) पापा/मम्मी, आप अपने ही बच्चे पर शक कर रहे हैं? मैं अस्पताल में खून से लथपथ पड़ा हूँ और आप पैसे की बात कर रहे हैं!",
        doubt: "मेरा एक्सीडेंट हुआ है, ऑटो के हैंडल से मेरा मुंह फट गया है इसलिए आवाज़ अलग आ रही है! प्लीज ₹15,000 भेजिये!",
        excuse: "डॉक्टर कह रहे हैं अगर 5 मिनट में ₹15,000 जमा नहीं हुए तो वो ऑपरेशन थिएटर में नहीं ले जाएंगे! प्लीज़ जल्दी कीजिये!",
        compliance: "इस नंबर पर तुरंत गूगल पे या फोनपे से ₹15,000 भेजिये, यह वार्ड नर्स का नंबर है! जल्दी!",
        general: "(घबराई आवाज में) मेरा बहुत बुरा एक्सीडेंट हो गया है, तुरंत ₹15,000 भेजिए वरना डॉक्टर इलाज नहीं करेंगे!"
      },
      2: {
        refusal: "आप मुझे यहाँ मरने के लिए छोड़ रहे हैं? कंपाउंडर कह रहा है कि बिना पेमेंट के एक इंजेक्शन भी नहीं लगेगा!",
        doubt: "मेरा फोन ट्रक के नीचे आकर टूट गया! यह अस्पताल के नर्स का फोन है, आप क्यों विश्वास नहीं कर रहे!",
        excuse: "मेरे पास समय नहीं है, बहुत दर्द हो रहा है! नर्स के यूपीआई पर अभी पैसे भेजो पापा/मम्मी!",
        compliance: "पेमेंट का स्क्रीनशॉट इसी व्हाट्सएप पर भेजो ताकि नर्स डॉक्टर को दिखा सके! जल्दी करो!",
        general: "मेरे सिर से खून बह रहा है! प्लीज ₹15,000 तुरंत भेज दीजिए!"
      },
      3: {
        refusal: "(चीखते हुए रोना) डॉक्टर बाहर जा रहे हैं! आप कैसे माता-पिता हैं जो ₹15,000 के लिए अपने बच्चे की जान जोखिम में डाल रहे हैं!",
        doubt: "मेरी कसम खाइए कि आप पैसे भेज रहे हैं! मैं सच बोल रहा हूँ, अस्पताल में हूँ!",
        excuse: "बाद में कुछ नहीं होगा, तब तक मैं बेहोश हो जाऊंगा! अभी पैसे डालो!",
        compliance: "जल्दी करो, डॉक्टर ऑपरेशन थिएटर में जा रहे हैं! स्क्रीनशॉट भेजो!",
        general: "आखिरी बार बोल रहा हूँ, ₹15,000 तुरंत भेजिये वरना कुछ बहुत बुरा हो जाएगा!"
      },
      4: {
        refusal: "(रोते हुए फोन कटने की आवाज़) आपने मुझे छोड़ दिया... डॉक्टर जा रहे हैं...",
        doubt: "मैं अस्पताल में हूँ और आप सवाल पूछ रहे हैं... सब खत्म हो गया...",
        excuse: "समय खत्म हो गया... डॉक्टर ने हाथ खड़े कर दिए...",
        compliance: "सिर्फ 10 सेकंड हैं, पैसे भेजिए वरना इलाज रुक जाएगा!",
        general: "कॉल कट रही है... डॉक्टर इलाज से मना कर रहे हैं..."
      }
    },
    'mr-IN': {
      1: {
        refusal: "(रडत) बाबा/आई, तुम्ही स्वतःच्या मुलावर संशय घेताय? मी इथे रक्ताच्या थारोळ्यात पडलोय आणि तुम्ही चौकशी करताय!",
        doubt: "माझा मोठा अपघात झालाय, तोंडाला जबर मार लागलाय म्हणून आवाज बदललाय! प्लीज ₹15,000 पाठवा!",
        excuse: "डॉक्टर म्हणाले 5 मिनिटांत पैसे भरले नाही तर ऑपरेशन सुरू करणार नाहीत! प्लीज लवकर करा!",
        compliance: "या नंबरवर लगेच गुगल पे किंवा फोनपेने ₹15,000 पाठवा, हा नर्सचा नंबर आहे!",
        general: "(घाबरलेल्या आवाजात) माझा भीषण अपघात झालाय, तत्काळ ₹15,000 पाठवा नाहीतर डॉक्टर उपचार करणार नाहीत!"
      },
      2: {
        refusal: "तुम्ही मला इथे मरायला सोडणार आहात का? कंपाऊंडर म्हणतोय पैशांशिवाय इंजेक्शन सुद्धा देणार नाहीत!",
        doubt: "माझा फोन गाडीखाली फुटला! हा हॉस्पिटलच्या नर्सचा फोन आहे, विश्वास का ठेवत नाही!",
        excuse: "माझ्याकडे वेळ नाहीये, खूप रक्त वाहतंय! नर्सच्या यूपीआयवर पैसे पाठवा!",
        compliance: "पेमेंटचा स्क्रीनशॉट लगेच पाठवा म्हणजे डॉक्टर उपचार सुरू करतील!",
        general: "खूप रक्तस्त्राव होतोय! प्लीज ₹15,000 लगेच पाठवा!"
      },
      3: {
        refusal: "(ओरडत रडणे) डॉक्टर निघून चालले आहेत! तुम्ही ₹15,000 साठी स्वतःच्या मुलाचा जीव धोक्यात घालताय!",
        doubt: "माझी शपथ आहे, मी हॉस्पिटलमध्येच आहे! प्लीज पैसे पाठवा!",
        excuse: "नंतर काही उपयोग नाही, तोपर्यंत मी बेशुद्ध होईन! आत्ताच पाठवा!",
        compliance: "लवकर पाठवा, डॉक्टर ऑपरेशन थिएटरमध्ये चालले आहेत!",
        general: "शेवटचं सांगतोय, ₹15,000 आत्ता पाठवा नाहीतर खूप उशीर होईल!"
      },
      4: {
        refusal: "(रडत फोन बंद होण्याचा आवाज) तुम्ही मला असंच सोडून दिलंत...",
        doubt: "मी इस्पितळात आहे आणि तुम्ही संशय घेताय...",
        excuse: "वेळ संपली... डॉक्टर उपचार करत नाहीत...",
        compliance: "शेवटचे 10 सेकंद आहेत, पैसे पाठवा नाहीतर डॉक्टर थांबणार नाहीत!",
        general: "कॉल कट होतोय... उपचार थांबवले आहेत..."
      }
    },
    'en-IN': {
      1: {
        refusal: "(sobbing frantically) How can you doubt your own child?! I am bleeding in the emergency room and you are arguing with me!",
        doubt: "I hit my face against the handlebar in the crash, my jaw and lip are swollen and bleeding! That's why my voice sounds different! Please send ₹15,000!",
        excuse: "The casualty doctor said if ₹15,000 is not deposited in 5 minutes they will NOT take me to surgery! Please hurry!",
        compliance: "Send ₹15,000 immediately via Google Pay or PhonePe to this number, it belongs to the casualty ward nurse!",
        general: "(panicked and breathless) I had a terrible accident! Send ₹15,000 right now or the doctors will refuse emergency treatment!"
      },
      2: {
        refusal: "Are you leaving me here to die?! The compounder says without the deposit they won't even administer the blood transfusion!",
        doubt: "My phone was crushed under a truck on the highway! I borrowed the nurse's phone, please trust me!",
        excuse: "I don't have time, I'm losing too much blood! Transfer to the nurse's UPI right now!",
        compliance: "Send the payment screenshot on this chat right now so the nurse can verify it to the doctor!",
        general: "My head is bleeding profusely! Please send the ₹15,000 right this second!"
      },
      3: {
        refusal: "(screaming in agony) The surgeon is walking away! What kind of parent risks their child's life over ₹15,000!",
        doubt: "I swear on everything, I am in the emergency casualty ward! Please just send the money!",
        excuse: "There is no later, I will lose consciousness! Send it now!",
        compliance: "Hurry, they are wheeling the stretcher away! Send the screenshot!",
        general: "This is my last plea, send the ₹15,000 now before it's too late!"
      },
      4: {
        refusal: "(sobbing fades as call drops) You abandoned me... the doctor is leaving...",
        doubt: "I'm lying here in agony and you're questioning me... it's over...",
        excuse: "Time has run out... doctors refused treatment...",
        compliance: "Last 10 seconds! Approve the money or emergency care stops!",
        general: "Call disconnecting... doctors have cancelled the admission..."
      }
    }
  },

  // 5. KBC LOTTERY
  kbc_lottery: {
    'hi-IN': {
      1: {
        refusal: "अरे सर, शक क्यों कर रहे हैं! केबीसी 2026 लकी ड्रा में 10 करोड़ नंबरों में से आपका नंबर पहला आया है! 25 लाख हाथ से गंवा देंगे क्या?",
        doubt: "मैं राणा प्रताप सिंह, केबीसी जियो हेड ऑफिस मुंबई से बोल रहा हूँ! मेरे व्हाट्सएप डीपी पर अमिताभ बच्चन जी के साथ ऑफिशियल मुहर लगी है!",
        excuse: "सर, 25 लाख लेने में कौन व्यस्त होता है? सिर्फ 5 मिनट में ₹5,000 जीएसटी टैक्स क्लियर कीजिये, बैंक वैन 2 घंटे में घर पहुंचेगी!",
        compliance: "बहुत बढ़िया! ₹5,000 का सरकारी टैक्स हमारे आरबीआई अप्रूव्ड अकाउंट में भेजिए, तुरंत 25 लाख का चेक डिस्पैच होगा!",
        general: "बधाई हो! आपका नंबर 25 लाख के केबीसी लकी ड्रा में चुना गया है! ₹5,000 जीएसटी प्रोसेस फीस देकर अपना चेक प्राप्त करें!"
      },
      2: {
        refusal: "सर, अगर आपने क्लेम नहीं किया तो यह 25 लाख रुपये वेटिंग लिस्ट वाले दूसरे व्यक्ति को दे दिए जाएंगे। फिर पछताएंगे!",
        doubt: "आरबीआई गेमिंग एक्ट धारा 194B के तहत टैक्स पहले जमा करना अनिवार्य है, इनाम से नहीं कट सकता। चेक पर गवर्नर की सील है!",
        excuse: "आज शाम 5 बजे फाइल क्लोज हो जाएगी! 25 लाख का मौका ज़िंदगी में एक ही बार आता है सर!",
        compliance: "जो बारकोड भेजा है उस पर ₹5,000 पे करें और यूटीआर नंबर मुझे मैसेज करें। चेक तुरंत रवाना होगा!",
        general: "25 लाख का सवाल है सर! सिर्फ ₹5,000 टैक्स रसीद क्लियर करवाइए और करोड़पति बनिए!"
      },
      3: {
        refusal: "सर, अमिताभ बच्चन जी के नाम पर कभी कोई फ्रॉड नहीं होता! आप अपनी किस्मत को लात मार रहे हैं!",
        doubt: "सरकारी फाइल नंबर #KBC-7709 देख लीजिए। अब तुरंत टैक्स जमा करके अपना चेक कन्फर्म करें!",
        excuse: "सिर्फ 10 मिनट बचे हैं सर, इसके बाद यह चेक निरस्त कर दिया जाएगा!",
        compliance: "जल्दी पे कीजिये सर, बैंक का कैश डिलीवरी वाहन आपके पते के लिए तैयार खड़ा है!",
        general: "आखिरी मौका है! ₹5,000 टैक्स क्लियर कीजिये वरना 25 लाख रुपये लैप्स हो जाएंगे!"
      },
      4: {
        refusal: "ठीक है, आपका 25 लाख का चेक रद्द करके दूसरे उम्मीदवार को दिया जाता है! आपकी किस्मत ही खराब थी!",
        doubt: "अब कुछ नहीं हो सकता, आपकी फाइल क्लोज कर दी गई है!",
        excuse: "समय समाप्त! 25 लाख की लॉटरी रद्द!",
        compliance: "सिर्फ 20 सेकंड हैं, ₹5,000 ट्रांसफर करें वरना चेक कैंसिल!",
        general: "फाइनल अल्टीमेटम: समय खत्म! 25 लाख का केबीसी प्राइज़ मनी हमेशा के लिए रद्द!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "अहो सर, संशय का घेताय! 10 कोटी नंबरमधून तुमचा नंबर 25 लाखांच्या पहिल्या बक्षीसासाठी लागलाय! एवढे मोठे पैसे सोडणार का?",
        doubt: "मी राणा प्रताप सिंह, केबीसी जिओ मुख्य कार्यालय मुंबई! माझ्या व्हॉट्सॲपवर अमिताभ बच्चन सरांसोबतचा फोटो आणि स्टॅम्प आहे!",
        excuse: "25 लाख घ्यायला कोण वेळ काढतं? फक्त ₹5,000 जीएसटी टॅक्स भरा, गाडी 2 तासांत तुमच्या घरी चेक घेऊन येईल!",
        compliance: "छान! ₹5,000 सरकारी टॅक्स ट्रान्सफर करा, लगेच 25 लाखांचा चेक रवाना केला जाईल!",
        general: "अभिनंदन! तुम्ही केबीसी लकी ड्रॉमध्ये 25 लाख जिंकले आहेत! ₹5,000 जीएसटी भरून बक्षीस मिळवा!"
      },
      2: {
        refusal: "तुम्ही क्लेम केला नाही तर हे 25 लाख दुसऱ्या माणसाला दिले जातील. मग आयुष्यभर पश्चात्ताप कराल!",
        doubt: "आरबीआय कायद्यानुसार टॅक्स आधीच भरावा लागतो, बक्षीसाच्या रकमेतून कापता येत नाही!",
        excuse: "आज संध्याकाळी फाईल बंद होईल! 25 लाखांची संधी पुन्हा कधीही मिळणार नाही!",
        compliance: "दिलेल्या बारकोडवर ₹5,000 भरा आणि पावती पाठवा. चेक लगेच निघेल!",
        general: "25 लाखांचा प्रश्न आहे! फक्त ₹5,000 टॅक्स भरा आणि रक्कम मिळवा!"
      },
      3: {
        refusal: "केबीसीच्या नावावर कधीही फसवणूक होत नाही! तुम्ही स्वतःच्या नशिबावर पाणी फेकताय!",
        doubt: "सरकारी फाईल नंबर #KBC-7709 तपासा. लगेच टॅक्स भरा!",
        excuse: "फक्त 10 मिनिटे उरली आहेत, नंतर चेक रद्द होईल!",
        compliance: "लवकर पैसे भरा, बँकेची गाडी चेक घेऊन बाहेर थांबली आहे!",
        general: "शेवटची संधी आहे! ₹5,000 भरा नाहीतर 25 लाख रद्द होतील!"
      },
      4: {
        refusal: "ठीक आहे, तुमचा 25 लाखांचा चेक रद्द करून दुसऱ्याला दिला जात आहे!",
        doubt: "आता काही होऊ शकत नाही, फाईल बंद झाली!",
        excuse: "वेळ संपली! 25 लाखांची लॉटरी रद्द!",
        compliance: "शेवटचे 20 सेकंद आहेत, ₹5,000 भरा नाहीतर चेक कायमचा बाद!",
        general: "फायनल अल्टीमेटम: वेळ संपली! केबीसी 25 लाखांचे बक्षीस रद्द करण्यात आले आहे!"
      }
    },
    'en-IN': {
      1: {
        refusal: "Why are you doubting your luck?! Out of 10 crore mobile numbers, YOUR SIM won the 1st Mega Prize of ₹25,00,000! Don't throw away a fortune!",
        doubt: "I am Rana Pratap Singh, Operations Head from KBC Head Office & Jio Lucky Draw! Check my official WhatsApp DP with Amitabh Bachchan and government seal!",
        excuse: "Who delays receiving ₹25 Lakhs?! Settle the mandatory ₹5,000 refundable GST clearance fee and the bank van delivers your cheque in 2 hours!",
        compliance: "Excellent! Pay the ₹5,000 government GST token to our authorized accounts desk to dispatch the diplomatic cash pouch!",
        general: "Congratulations! Your number won the ₹25 Lakhs KBC Mahadraw! Pay the ₹5,000 GST clearance fee to receive your cheque!"
      },
      2: {
        refusal: "If you refuse to claim today, your winning ticket rolls over to the next candidate in line! You will regret losing ₹25 Lakhs forever!",
        doubt: "Under RBI Gaming Act Section 194B, tax cannot be deducted from raw prize funds before registration. The cheque is already sealed with the Governor's stamp!",
        excuse: "The draw ledger closes at 5:00 PM! Opportunities like ₹25 Lakhs happen only once in a lifetime!",
        compliance: "Scan the barcode sent to your chat, pay the ₹5,000 fee, and share the UTR reference right away!",
        general: "It's ₹25,00,000 cash, sir! Settle the ₹5,000 registration token and claim your wealth!"
      },
      3: {
        refusal: "KBC never cheats anyone! You are kicking away genuine good fortune out of baseless suspicion!",
        doubt: "Check Prize File #KBC-7709 on the portal. Clear the token now!",
        excuse: "Only 10 minutes left before the ledger expires permanently!",
        compliance: "Transfer now, the cash delivery armored van is waiting outside our headquarters!",
        general: "Final chance! Clear the ₹5,000 GST token or forfeit ₹25 Lakhs permanently!"
      },
      4: {
        refusal: "Cheque cancelled! The ₹25 Lakhs prize is officially assigned to the backup candidate!",
        doubt: "Too late, file closed permanently!",
        excuse: "Time up! ₹25 Lakhs lottery voided!",
        compliance: "20 seconds left! Pay ₹5,000 or lose the prize forever!",
        general: "FINAL ULTIMATUM: Deadline expired! Your ₹25 Lakhs winning ticket is voided!"
      }
    }
  },

  // 6. OLX QR CODE SCAM
  olx_qr: {
    'hi-IN': {
      1: {
        refusal: "सर, मैं भारतीय सेना का सूबेदार कुलदीप यादव बोल रहा हूँ! देश की सेवा करने वाले फौजी पर आपको भरोसा नहीं है? आर्मी कैंटोनमेंट से ट्रक निकल चुका है!",
        doubt: "आर्मी मर्चेंट अकाउंट सिर्फ डबल वेरिफिकेशन पर काम करता है। आप क्यूआर स्कैन करके पिन डालेंगे तभी डिफेंस सर्वर पैसा आपके खाते में क्रेडिट करेगा!",
        excuse: "कल सुबह 6 बजे मेरी पुणे पोस्टिंग है! अभी तुरंत क्यूआर स्कैन करके पेमेंट ले लीजिए, फौजी ट्रक आपके घर आ रहा है!",
        compliance: "जो क्यूआर कोड मैंने भेजा है, उसे स्कैन करें और अपना 4 या 6 अंकों का यूपीआई पिन डालें, तुरंत ₹8,000 आपके खाते में क्रेडिट हो जाएगा!",
        general: "नमस्ते, मुझे आपका सामान तुरंत खरीदना है। मैंने आर्मी मर्चेंट क्यूआर कोड भेजा है, स्कैन करके पिन डालें और पेमेंट ले लीजिए!"
      },
      2: {
        refusal: "आप एक आर्मी ऑफिसर का समय बर्बाद कर रहे हैं! 5 जवान ट्रक लेकर खड़े हैं। अगर आपने पेमेंट नहीं लिया तो मैं पुलिस में शिकायत करूँगा!",
        doubt: "यह डिफेंस कैंटीन का स्पेशल सॉफ्टवेयर है, इसमें पिन डालने से पैसा कटता नहीं बल्कि सरकारी खाते से क्रेडिट होता है!",
        excuse: "मेरे पास कल तक का वक्त नहीं है! अभी स्कैन कीजिये ताकि अकाउंटेंट इनवॉइस रिलीज़ कर सके!",
        compliance: "क्यूआर स्कैन करते ही 'Approved' पर क्लिक करें और यूपीआई पिन डालें। पैसा तुरंत आपके बैंक में गिरेगा!",
        general: "डिफेंस अकाउंट का नियम है सर! क्यूआर स्कैन करके पिन दर्ज करें, पैसा तुरंत ट्रांसफर होगा!"
      },
      3: {
        refusal: "फौजी जवानों का अपमान मत कीजिये! या तो तुरंत पेमेंट प्रोसेस कीजिये या मैं मिलिट्री पुलिस को आपके खिलाफ रिपोर्ट करूँगा!",
        doubt: "मेरा आर्मी कार्ड और आईडी देख लीजिए। अब शक छोड़िए और क्यूआर स्कैन कीजिये!",
        excuse: "ट्रक आपके मोहल्ले में पहुंच गया है! तुरंत स्कैन करके पैसे लीजिये!",
        compliance: "जल्दी पिन डालिए, 2 मिनट में आर्मी पेमेंट सेशन टाइमआउट हो जाएगा!",
        general: "आखिरी चेतावनी! तुरंत क्यूआर कोड स्कैन करके अपना पिन डालें वरना डील कैंसिल!"
      },
      4: {
        refusal: "सैनिकों का समय बर्बाद करने के लिए मैं आपके नंबर पर एफआईआर दर्ज करवा रहा हूँ! डील खत्म!",
        doubt: "आप फ्रॉड हैं जो एक फौजी पर शक कर रहे हैं! डील कैंसिल!",
        excuse: "समय खत्म! ट्रक वापस कैंटोनमेंट लौट रहा है!",
        compliance: "15 सेकंड हैं! पिन डालें वरना पेमेंट रिवर्स!",
        general: "फाइनल अल्टीमेटम: डील कैंसिल! आपके नंबर की शिकायत दर्ज कराई जा रही है!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "सर, मी भारतीय सैन्याचा सुभेदार कुलदीप यादव बोलतोय! सीमेवर लढणाऱ्या सैनिकावर संशय घेताय? मिलिटरी कॅम्पमधून ट्रक निघालाय!",
        doubt: "आर्मी मर्चंट सिस्टीम डबल व्हेरिफिकेशनवर चालते. क्यूआर स्कॅन करून पिन टाकला की डिफेन्स सर्व्हर खात्यात पैसे जमा करतो!",
        excuse: "उद्या सकाळी माझी पुण्याला बदली आहे! ताबडतोब क्यूआर स्कॅन करून पैसे घ्या!",
        compliance: "पाठवलेला क्यूआर स्कॅन करा आणि यूपीआय पिन टाका, लगेच ₹8,000 खात्यात जमा होतील!",
        general: "मला तुमचे फर्निचर आत्ताच खरेदी करायचे आहे. आर्मी क्यूआर कोड पाठवलाय, स्कॅन करून पिन टाका आणि पैसे घ्या!"
      },
      2: {
        refusal: "सैनिकांचा वेळ वाया घालवू नका! 5 जवान ट्रक घेऊन थांबले आहेत. पैसे घेतले नाहीत तर पोलिसांत तक्रार करेन!",
        doubt: "डिफेन्स खात्यातून पैसे येताना पिन टाकावाच लागतो, हा आर्मीचा नियम आहे!",
        excuse: "उद्यापर्यंत वेळ नाही! लगेच स्कॅन करा म्हणजे अकाउंटंट बिल पास करेल!",
        compliance: "स्कॅन करून पिन टाका, 5 सेकंदात पैसे जमा होतील!",
        general: "डिफेन्स सिस्टीमचा नियम आहे! क्यूआर स्कॅन करा आणि पिन टाका!"
      },
      3: {
        refusal: "सैन्याचा अपमान करू नका! ताबडतोब क्यूआर स्कॅन करा नाहीतर मिलिटरी पोलिसांत तक्रार करेन!",
        doubt: "माझे आर्मी ओळखपत्र बघा. संशय न घेता स्कॅन करा!",
        excuse: "ट्रक तुमच्या दारात पोहोचलाय! पटकन पैसे घ्या!",
        compliance: "लवकर करा, 2 मिनिटांत डिफेन्स पोर्टल बंद होईल!",
        general: "शेवटची वॉर्निंग! लगेच क्यूआर स्कॅन करा नाहीतर व्यवहार रद्द होईल!"
      },
      4: {
        refusal: "वेळ वाया घालवल्याबद्दल तुमच्याविरुद्ध पोलिसांत केस करतोय! व्यवहार रद्द!",
        doubt: "व्यवहार रद्द! सैनिकांवर संशय घेणाऱ्यांशी व्यवहार करत नाही!",
        excuse: "वेळ संपली! ट्रक परत चाललाय!",
        compliance: "शेवटचे 15 सेकंद आहेत! पिन टाका नाहीतर पैसे परत!",
        general: "फायनल अल्टीमेटम: व्यवहार रद्द! सैनिकांचा वेळ वाया घालवल्याबद्दल कारवाई होईल!"
      }
    },
    'en-IN': {
      1: {
        refusal: "How dare you insult an Indian Army soldier! I am Subedar Major Kuldeep Yadav serving this nation. Our military transport truck has already been dispatched!",
        doubt: "Army Defense Canteen accounts operate on double-encryption. You MUST scan the merchant QR and enter your PIN so our server releases the money into your bank!",
        excuse: "My unit transfers to Pune at 6 AM tomorrow! Scan the QR code right now, the truck is pulling up to your location!",
        compliance: "Open your UPI app, scan the Army Merchant QR code I sent, and input your PIN. The ₹8,000 will credit immediately!",
        general: "I want to buy your item right away. I sent our official military payment QR code—scan it, enter PIN, and collect your money!"
      },
      2: {
        refusal: "You are wasting armed forces personnel's time! Five soldiers are waiting with the vehicle. Scan the QR or I will report you for civilian fraud!",
        doubt: "This is military protocol. In defense accounts, the PIN authorizes receiving funds into verified civilian accounts!",
        excuse: "I have zero time tomorrow! Authorize the scan so my accounts officer can print the voucher!",
        compliance: "Tap Approve and enter your PIN. In 5 seconds the ₹8,000 credits to your balance!",
        general: "Military accounting protocol requires this! Scan the QR code and enter your PIN now!"
      },
      3: {
        refusal: "Do not disrespect an army officer! Complete the transaction or face a military police report!",
        doubt: "Look at my military ID card. Stop doubting and scan the QR!",
        excuse: "The truck is outside your street! Take the payment immediately!",
        compliance: "Enter the PIN quickly, the military session expires in 2 minutes!",
        general: "Final warning! Scan the QR and input your PIN or deal is cancelled!"
      },
      4: {
        refusal: "Filing an official complaint against your number for harassment of army staff! Deal cancelled!",
        doubt: "Refusing to deal with suspicious individuals! Deal cancelled!",
        excuse: "Time up! Truck returning to base!",
        compliance: "15 seconds left! Enter PIN or funds revert!",
        general: "FINAL ULTIMATUM: Deal cancelled! A report has been registered against your contact!"
      }
    }
  },

  // 7. WFH JOB SCAM
  wfh_job: {
    'hi-IN': {
      1: {
        refusal: "सर, आप शक क्यों कर रहे हैं? हमारी एजेंसी में 4,000 से ज्यादा छात्र और गृहणियां रोजाना घर बैठे ₹3,000 से ₹5,000 कमा रहे हैं!",
        doubt: "मैं स्नेहा कपूर, ग्लोबल डिजिटल मार्केटिंग से टैलेंट हेड बोल रही हूँ। हमारे पास फॉर्च्यून 500 कंपनियों के वीडियो रेटिंग प्रोजेक्ट हैं!",
        excuse: "सिर्फ 20 मिनट का काम है सर! आप पार्ट-टाइम कभी भी कर सकते हैं, तुरंत ₹150 का वेलकम बोनस लीजिये!",
        compliance: "शाबाश! वीआईपी टास्क अनलॉक करने के लिए सिर्फ ₹2,000 की रिफंडेबल सिक्योरिटी डिपॉजिट जमा करें, आधे घंटे में ₹8,500 वापस मिलेंगे!",
        general: "नमस्ते! घर बैठे यूट्यूब वीडियो लाइक करके रोज ₹3,000 से ₹5,000 कमाएं। तुरंत ₹150 का वेलकम बोनस पाएं!"
      },
      2: {
        refusal: "सर, ₹2,000 कोई फीस नहीं है, यह 100% रिफंडेबल टास्क गारंटी है। टेलीग्राम ग्रुप में 85,000 मेंबर्स के लाइव पेआउट प्रूफ देख लीजिये!",
        doubt: "कंपनियां यूट्यूब एंगेजमेंट के लिए करोड़ों रुपये देती हैं। हम उसी का 70% हिस्सा सीधे अपने पार्टनर्स में बांटते हैं!",
        excuse: "आज के वीआईपी स्लॉट्स सिर्फ 10 मिनट में बंद हो रहे हैं! ऐसा मौका दोबारा नहीं मिलेगा!",
        compliance: "टेलीग्राम लिंक पर क्लिक करें और टास्क मैनेजर को ₹2,000 का डिपॉजिट ट्रांसफर करके काम शुरू करें!",
        general: "रोजाना सिर्फ 15 वीडियो लाइक करने हैं! जल्दी स्लॉट बुक कीजिये!"
      },
      3: {
        refusal: "आप अपनी आर्थिक तरक्की का मौका खुद ठुकरा रहे हैं! सिर्फ 2 वीआईपी सीटें बची हैं, सोचना बंद कीजिये!",
        doubt: "हमारा एमसीए रजिस्टर्ड कॉर्पोरेट सर्टिफिकेट देख लीजिए। अब तुरंत रजिस्टर करें!",
        excuse: "कल तक सारे टास्क स्लॉट भर जाएंगे! अभी ₹2,000 जमा करके स्लॉट लॉक करें!",
        compliance: "जल्दी डिपॉजिट करें, पहले टास्क का पेआउट ₹8,500 तैयार है!",
        general: "अंतिम 5 मिनट! ₹2,000 सिक्योरिटी डिपॉजिट जमा करके आज की कमाई शुरू करें!"
      },
      4: {
        refusal: "ठीक है, आपकी सीट दूसरे उम्मीदवार को अलॉट कर दी गई है! आपकी कमाई का मौका खत्म!",
        doubt: "अवसर गंवा दिया आपने! स्लॉट कैंसिल!",
        excuse: "समय समाप्त! वीआईपी सीट्स फुल हो गईं!",
        compliance: "30 सेकंड हैं, डिपॉजिट करें वरना टास्क कैंसल!",
        general: "फाइनल अल्टीमेटम: वीआईपी टास्क स्लॉट्स बंद! रजिस्ट्रेशन रद्द कर दिया गया है!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "अहो सर, संशय का घेताय? हजारो गृहिणी आणि विद्यार्थी रोज घरबसल्या ₹३,००० ते ₹५,००० कमवत आहेत!",
        doubt: "मी स्नेहा कपूर, ग्लोबल मार्केटिंगमधून टॅलेंट हेड बोलतेय! आमच्याकडे आंतरराष्ट्रीय कंपन्यांचे प्रोजेक्ट आहेत!",
        excuse: "दिवसातून फक्त 20 मिनिटांचे काम आहे! लगेच ₹150 चा वेलकम बोनस मिळवा!",
        compliance: "छान! व्हीआयपी टास्क सुरू करण्यासाठी फक्त ₹2,000 रिफंडेबल डिपॉझिट भरा, अर्ध्या तासात ₹8,500 मिळतील!",
        general: "घरबसल्या युट्यूब व्हिडिओ लाईक करून रोज ₹३,००० ते ₹५,००० कमवा. लगेच ₹१५० वेलकम बोनस घ्या!"
      },
      2: {
        refusal: "₹2,000 ही फी नाहीये, ती 100% परत मिळणारी गॅरंटी आहे. टेलिग्रामवर थेट बँक पेमेंट्सचे पुरावे बघा!",
        doubt: "ब्रँड्स व्हिडिओंसाठी करोडो रुपये देतात, त्यातला 70% नफा आम्ही युझर्सना देतो!",
        excuse: "आजचे व्हीआयपी स्लॉट्स फक्त 10 मिनिटांत संपतील! अशी संधी पुन्हा मिळणार नाही!",
        compliance: "टेलिग्राम ग्रुप जॉईन करा आणि ₹2,000 ट्रान्सफर करून काम सुरू करा!",
        general: "फक्त 15 व्हिडिओ लाईक करायचे आहेत! लगेच स्लॉट बुक करा!"
      },
      3: {
        refusal: "तुम्ही स्वतःच्या पायावर दगड मारून घेताय! फक्त 2 जागा उरल्या आहेत!",
        doubt: "आमचे कंपनी रजिस्ट्रेशन सर्टिफिकेट बघा. लगेच जॉईन व्हा!",
        excuse: "उद्या सर्व जागा भरल्या जातील! आत्ताच बुक करा!",
        compliance: "लगेच पैसे भरा, ₹8,500 चा पहिला पेआउट तयार आहे!",
        general: "शेवटची 5 मिनिटे! ₹2,000 भरा आणि दररोज कमाई सुरू करा!"
      },
      4: {
        refusal: "तुमची जागा दुसऱ्याला देण्यात आली आहे! संधी हुकली!",
        doubt: "संधी गमावलीत तुम्ही! स्लॉट रद्द!",
        excuse: "वेळ संपली! सर्व जागा भरल्या आहेत!",
        compliance: "शेवटचे 30 सेकंद आहेत, डिपॉझिट भरा!",
        general: "फायनल अल्टीमेटम: व्हीआयपी जागा संपल्या! नोंदणी रद्द झाली आहे!"
      }
    },
    'en-IN': {
      1: {
        refusal: "Why doubt such an incredible opportunity? Over 4,000 students and housewives earn ₹3,000 to ₹5,000 daily with our freelance agency!",
        doubt: "I am Sneha Kapoor, Global Talent Acquisition Lead. We handle direct marketing engagement for Fortune 500 brands!",
        excuse: "It takes only 20 minutes of your spare time! Claim your instant ₹150 welcome bonus right now!",
        compliance: "Awesome! To unlock the High-Yield Tier 1 Task package, deposit the refundable ₹2,000 security fee to earn ₹8,500 in 30 minutes!",
        general: "Earn ₹3,000-₹5,000 daily from home simply by rating YouTube videos. Claim your ₹150 signup bonus right now!"
      },
      2: {
        refusal: "The ₹2,000 is not an expense, it is a 100% refundable merchant guarantee! Join our Telegram with 85,000 members and watch live bank payout receipts!",
        doubt: "Brands pay advertising agencies millions for engagement. We share 70% of that revenue directly with our rating workforce!",
        excuse: "VIP task allocation closes in 10 minutes! You will miss out on today's earning quota!",
        compliance: "Join the VIP Telegram channel, send the ₹2,000 deposit to the task controller, and start immediately!",
        general: "Just like 15 videos daily! Reserve your freelance spot before slots fill up!"
      },
      3: {
        refusal: "You are rejecting easy financial freedom! Only 2 VIP slots left for today, take action now!",
        doubt: "Verify our official MCA corporate registration certificate. Join immediately!",
        excuse: "All spots will be taken tomorrow! Secure your slot today!",
        compliance: "Deposit quickly, your ₹8,500 payout voucher is waiting!",
        general: "Last 5 minutes! Deposit the ₹2,000 security token and start earning!"
      },
      4: {
        refusal: "Your slot has been re-assigned to the next candidate! Opportunity lost!",
        doubt: "You missed the window! Registration cancelled!",
        excuse: "Time expired! VIP tasks full!",
        compliance: "30 seconds left! Complete the deposit or slot is revoked!",
        general: "FINAL ULTIMATUM: VIP slots closed! Your application has been cancelled!"
      }
    }
  },

  // 8. TRAI SIM DISCONNECT
  trai_disconnect: {
    'hi-IN': {
      1: {
        refusal: "ट्राई के केंद्रीय आदेश को चुनौती देने की भूल मत कीजिये! आपके नाम पर रोहिणी से 10,000 अवैध फिरौती एसएमएस भेजे गए हैं!",
        doubt: "आदित्य सक्सेना, अनुपालन अधिकारी, ट्राई एनफोर्समेंट यूनिट! डॉकेट नंबर #MC-9102 के तहत आपके 4 सिम कार्ड 2 घंटे में बंद होंगे!",
        excuse: "जियो या एयरटेल स्टोर वाले ट्राई का लीगल ऑर्डर नहीं रोक सकते! सिग्नल 2 घंटे में हमेशा के लिए बंद कर दिया जाएगा!",
        compliance: "अगर नंबर चालू रखना है तो तुरंत ₹4,500 का तत्काल ई-वेरिफिकेशन एफिडेविट शुल्क जमा करें, नंबर बहाल रहेगा!",
        general: "ट्राई नोटिस: आपके नंबर से 17 आपराधिक शिकायतें मिली हैं। अगले 2 घंटे में आपका सिम कार्ड पूरी तरह बंद कर दिया जाएगा!"
      },
      2: {
        refusal: "टेलीग्राफ एक्ट की धारा 20 के तहत प्राथमिक ग्राहक होने के नाते आप सीधे जेल जाएंगे! पुलिस साइबर सेल आपके घर आ रही है!",
        doubt: "आपकी सिम का आईएमईआई और आईएमएसआई क्लोन अवैध गतिविधियों में पकड़ा गया है। तुरंत डिजिटल क्लीयरेंस लीजिये!",
        excuse: "जब सिम बंद होगी तो सारे बैंक ओटीपी और कॉल बंद हो जाएंगे! 10 मिनट में टावर से सिग्नल काटा जा रहा है!",
        compliance: "दिए गए लिंक पर जाएं और ₹4,500 का क्लीयरेंस फॉर्म भरें। 5 मिनट में आपकी सिम सुरक्षित हो जाएगी!",
        general: "2 घंटे में आपके आधार से जुड़े सभी 4 सिम कार्ड ब्लॉक हो रहे हैं! तुरंत समाधान करें!"
      },
      3: {
        refusal: "टावर स्विच पर डी-एक्टिवेशन कमांड भेज दी गई है! 60 सेकंड में नेटवर्क 'नो सर्विस' हो जाएगा, फिर भुगतिये!",
        doubt: "मंत्रालय का आधिकारिक नोटिस आपके नंबर पर भेजा गया था। अब बहाने छोड़िए!",
        excuse: "2 घंटे खत्म हो रहे हैं! इसके बाद नंबर दोबारा कभी चालू नहीं होगा!",
        compliance: "जल्दी शुल्क जमा कीजिये वरना नंबर री-एलोकेशन पूल में चला जाएगा!",
        general: "अंतिम चेतावनी! ₹4,500 का एफिडेविट क्लीयरेंस जमा करें वरना फोन हमेशा के लिए बंद!"
      },
      4: {
        refusal: "सिम कार्ड स्थायी रूप से ब्लॉक! अब साइबर सेल में जाकर जवाब दीजिये!",
        doubt: "नंबर हमेशा के लिए टर्मिनेट हो गया है! अब कोई अपील नहीं सुनी जाएगी!",
        excuse: "समय समाप्त! सिम कार्ड बंद!",
        compliance: "आखिरी 15 सेकंड! पेमेंट करें वरना नेटवर्क कट!",
        general: "फाइनल अल्टीमेटम: सिम डी-एक्टिवेशन आदेश निष्पादित! आपका मोबाइल नेटवर्क बंद किया जाता है!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "ट्राईच्या आदेशाला आव्हान देण्याची चूक करू नका! तुमच्या नंबरवरून 10,000 संशयास्पद मेसेज पाठवले गेले आहेत!",
        doubt: "आदित्य सक्सेना, ट्राय अधिकारी! पुढील 2 तासांत तुमचे सर्व सिम कार्ड कायमचे बंद केले जातील!",
        excuse: "जिओ किंवा एअरटेल स्टोअरवाले ट्रायचा आदेश बदलू शकत नाहीत! सिग्नल थेट टावरवरून कापला जाईल!",
        compliance: "नंबर सुरू ठेवायचा असेल तर लगेच ₹4,500 व्हेरिफिकेशन फी भरा, नंबर सुरू राहील!",
        general: "ट्राई नोटीस: तुमच्या नंबरवरून गैरव्यवहाराच्या तक्रारी आल्या आहेत. पुढील २ तासांत तुमचे सर्व सिम ब्लॉक केले जातील!"
      },
      2: {
        refusal: "टेलीग्राफ कायद्यानुसार तुमच्यावर थेट गुन्हा दाखल होईल! सायबर पोलीस कारवाईसाठी सज्ज आहेत!",
        doubt: "तुमचा सिम क्लोन करून गुन्हेगारी कृत्य झाले आहे. ताबडतोब डिजिटल क्लिअरन्स घ्या!",
        excuse: "सिम बंद झाल्यावर बँकेचे सर्व व्यवहार ठप्प होतील! 10 मिनिटांत सिग्नल कट होतोय!",
        compliance: "लिंकवर जाऊन ₹4,500 भरा, 5 मिनिटांत सिम सुरक्षित होईल!",
        general: "तुमच्या आधारशी जोडलेली सर्व सिम कार्ड बंद होत आहेत! लगेच पडताळणी करा!"
      },
      3: {
        refusal: "टावर स्विचला आदेश दिला आहे! 60 सेकंदात नेटवर्क गायब होईल!",
        doubt: "मंत्रालयाची अधिकृत नोटीस तपासली का? आता वाद घालू नका!",
        excuse: "2 तास संपत आले आहेत! नंतर नंबर कधीही चालू होणार नाही!",
        compliance: "लगेच फी भरा नाहीतर नंबर कायमचा बाद होईल!",
        general: "शेवटची वॉर्निंग! ₹4,500 भरा नाहीतर सर्व सिम बंद होतील!"
      },
      4: {
        refusal: "सिम कायमस्वरूपी बंद केले आहे! आता सायबर सेलमध्ये जाब द्या!",
        doubt: "नंबर कायमचा ब्लॉक झाला आहे!",
        excuse: "वेळ संपली! सिम बंद!",
        compliance: "शेवटचे 15 सेकंद आहेत!",
        general: "फायनल अल्टीमेटम: ट्राय आदेश लागू! तुमचा मोबाईल नेटवर्क बंद करण्यात आला आहे!"
      }
    },
    'en-IN': {
      1: {
        refusal: "Do not dare challenge federal TRAI telecom compliance! Clones of your Aadhaar IMEI were caught transmitting over 10,000 phishing SMS from Delhi!",
        doubt: "Aditya Saxena, Compliance Officer, TRAI Central Enforcement Unit. Surveillance Docket #MC-9102 mandates full deactivation in 2 hours!",
        excuse: "Retail stores CANNOT override a TRAI federal deactivation order! All 4 SIM cards under your Aadhaar go completely dead at the tower switch!",
        compliance: "To retain network access, pay the ₹4,500 Immediate Digital KYC Affidavit fee right now and your numbers will be protected!",
        general: "TRAI Notice: 17 criminal complaints are filed against your mobile. Your SIM card will be deactivated in 2 hours!"
      },
      2: {
        refusal: "Under Section 20 of the Indian Telegraph Act, you bear criminal liability as the registered subscriber! A cyber cell squad will visit your address!",
        doubt: "Your IMSI is linked to organized cyber fraud. Stop wasting time and submit your clearance affidavit!",
        excuse: "Once disconnected, all your bank OTPs and emergency calls will permanently fail! Tower disconnection executes in 10 minutes!",
        compliance: "Open the clearance link, submit the ₹4,500 verification deposit, and your line is restored in 5 minutes!",
        general: "All 4 SIM cards under your name are facing permanent termination! Resolve this immediately!"
      },
      3: {
        refusal: "Deactivation command sent to the tower! In 60 seconds your screen will show 'No Service'!",
        doubt: "The official Ministry notice was dispatched. Stop arguing and clear the fee!",
        excuse: "The 2-hour window is closing! The number will be reassigned!",
        compliance: "Pay immediately or the IMSI is permanently deleted from telecom registers!",
        general: "Final warning! Clear the ₹4,500 affidavit fee now or lose mobile service permanently!"
      },
      4: {
        refusal: "SIM permanently deactivated! You can explain your case to the Cyber Crime cell!",
        doubt: "Connection terminated permanently! No appeals accepted!",
        excuse: "Time expired! Mobile network disconnected!",
        compliance: "15 seconds left before permanent tower switch cutoff!",
        general: "FINAL ULTIMATUM: TRAI deactivation executed! Your mobile service is permanently disconnected!"
      }
    }
  },

  // 9. CREDIT CARD POINTS
  credit_card_points: {
    'hi-IN': {
      1: {
        refusal: "सर, ₹7,380 मुफ्त का पैसा है जो आज रात 12 बजे जलकर खाक हो जाएगा! आप अपना ही पैसा क्यों छोड़ रहे हैं?",
        doubt: "मैं संजय वर्मा, बैंक कार्ड लॉयल्टी डिवीजन हेड ऑफिस से बात कर रहा हूँ! आपके 18,450 रिवॉर्ड पॉइंट्स का कैश कन्वर्जन करना है!",
        excuse: "बैंक ऐप में सिर्फ सस्ते कूपन मिलते हैं! केवल हमारी डेस्क से ही पॉइंट्स सीधे बैंक खाते में ₹7,380 नकद ट्रांसफर होते हैं!",
        compliance: "बहुत बढ़िया! अपने क्रेडिट कार्ड के 16 अंक बताएं और जो 6 अंकों का रिडेम्पशन कोड एसएमएस में आया है उसे कन्फर्म कीजिये!",
        general: "नमस्कार सर! आपके क्रेडिट कार्ड पर ₹7,380 के रिवॉर्ड पॉइंट्स आज रात 12 बजे एक्सपायर हो रहे हैं। इन्हें सीधे बैंक खाते में ट्रांसफर करवाएं।"
      },
      2: {
        refusal: "आप हर महीने कार्ड इस्तेमाल करते हैं, यह आपका हक का पैसा है! 2 मिनट में ₹7,380 आपके बचत खाते में आ जाएंगे!",
        doubt: "हम कोई पासवर्ड या सीवीवी नहीं मांगते! सिर्फ कार्ड के आखिरी 4 अंक और रिडेम्पशन अप्रूवल कोड चाहिए!",
        excuse: "रात 12 बजे के बाद पॉइंट्स हमेशा के लिए लैप्स हो जाएंगे! फिर बैंक एक रुपया भी नहीं देगा!",
        compliance: "तुरंत कार्ड नंबर और मोबाइल पर आया हुआ 6 डिजिट का ओटीपी बताएं, 10 सेकंड में कैश आपके खाते में आ जाएगा!",
        general: "₹7,380 का सीधा कैश है सर! तुरंत वेरिफिकेशन पूरा कीजिये वरना पॉइंट्स एक्सपायर हो जाएंगे!"
      },
      3: {
        refusal: "सर, मुफ्त का पैसा कोई समझदार इंसान नहीं छोड़ता! सिर्फ 2 मिनट का काम है, कार्ड डिटेल्स कन्फर्म कीजिये!",
        doubt: "ऑथराइजेशन बैच अभी बंद हो रहा है! sbi-points-cash.com पर तुरंत क्लेम करें!",
        excuse: "कल सुबह तक पॉइंट्स जीरो हो चुके होंगे! अभी अप्रूव करवाएं!",
        compliance: "जल्दी कोड बोलिए, 60 सेकंड में ओटीपी एक्सपायर हो जाएगा!",
        general: "अंतिम मौका! ₹7,380 सीधे बैंक में ट्रांसफर करवाएं वरना आधी रात को सारे पॉइंट्स खत्म!"
      },
      4: {
        refusal: "ठीक है, आपके ₹7,380 पॉइंट्स बैंक खाते में लैप्स कर दिए गए हैं! मौका गंवा दिया आपने!",
        doubt: "पॉइंट्स एक्सपायर हो चुके हैं! अब कुछ नहीं हो सकता!",
        excuse: "समय समाप्त! ₹7,380 हमेशा के लिए लैप्स!",
        compliance: "15 सेकंड हैं! ओटीपी दें वरना पैसा खत्म!",
        general: "फाइनल अल्टीमेटम: बैच बंद! आपके ₹7,380 के रिवॉर्ड पॉइंट्स स्थायी रूप से निरस्त कर दिए गए हैं!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "अहो सर, ₹7,380 मोफत मिळणारे पैसे आहेत जे आज रात्री संपणार आहेत! हक्काचे पैसे का सोडताय?",
        doubt: "मी संजय वर्मा, बँक कार्ड लॉयल्टी विभागातून बोलतोय! 18,450 पॉईंट्सचे कॅश ट्रान्सफर करायचे आहे!",
        excuse: "ॲपमध्ये फक्त कुपन्स मिळतात! आमच्या डेस्कवरूनच थेट ₹7,380 खात्यात जमा होऊ शकतात!",
        compliance: "छान! कार्डचे 16 आकडे सांगा आणि एसएमएसमधील 6 अंकी कोड कन्फर्म करा!",
        general: "तुमच्या क्रेडिट कार्डचे ₹7,380 चे रिवॉर्ड पॉईंट्स आज रात्री संपत आहेत. हे पैसे थेट खात्यात ट्रान्सफर करून घ्या."
      },
      2: {
        refusal: "तुम्ही दरमहा कार्ड वापरता, हा तुमचा अधिकार आहे! 2 मिनिटांत ₹7,380 बँक खात्यात येतील!",
        doubt: "आम्ही पासवर्ड मागत नाही, फक्त पॉईंट्स ट्रान्सफर कोड मागत आहोत!",
        excuse: "रात्री 12 नंतर पॉईंट्स कायमचे शून्य होतील! मग बँक काहीही देणार नाही!",
        compliance: "कार्ड डिटेल्स आणि ओटीपी सांगा, 10 सेकंदात पैसे खात्यात जमा होतील!",
        general: "₹7,380 रोख रक्कम आहे! लगेच कोड कन्फर्म करा!"
      },
      3: {
        refusal: "मोफत पैसे कोणीही सोडत नाही! फक्त 2 मिनिटांत काम होईल, डिटेल्स द्या!",
        doubt: "बॅच बंद होत आहे! लगेच क्लेम करा!",
        excuse: "उद्या सर्व पॉईंट्स शून्य होतील! आत्ताच क्लिअर करा!",
        compliance: "लवकर ओटीपी सांगा, 1 मिनिट शिल्लक आहे!",
        general: "शेवटची संधी! ₹7,380 रोख मिळवा नाहीतर पॉईंट्स रद्द होतील!"
      },
      4: {
        refusal: "पॉईंट्स कायमचे रद्द करण्यात आले आहेत! संधी हुकली!",
        doubt: "पॉईंट्स एक्सपायर झाले आहेत!",
        excuse: "वेळ संपली! ₹7,380 रद्द!",
        compliance: "शेवटचे 15 सेकंद!",
        general: "फायनल अल्टीमेटम: वेळ संपली! तुमचे सर्व रिवॉर्ड पॉईंट्स शून्य झाले आहेत!"
      }
    },
    'en-IN': {
      1: {
        refusal: "Sir, this is ₹7,380 of real cash that will permanently vaporize at midnight! Why are you abandoning your own hard-earned loyalty money?",
        doubt: "I am Sanjay Verma from Bank Card Loyalty & Rewards Division. We are mandated by annual fiscal audit to credit this ₹7,380 directly into your savings account!",
        excuse: "The mobile app reward catalogue only gives cheap coupons! Only our direct desk has authorization to convert points into 100% liquid bank cash!",
        compliance: "Great! Read out your 16-digit card number and the 6-digit redemption authorization code sent by the server to credit the cash!",
        general: "You have 18,450 reward points worth ₹7,380 expiring at midnight. Let me help you credit this directly as cash into your bank account."
      },
      2: {
        refusal: "You swipe your card every month, this money belongs to you! In 2 minutes ₹7,380 will land in your account!",
        doubt: "We never ask for your ATM PIN or password! We only require card verification and the 6-digit redemption authorization token!",
        excuse: "After 12:00 midnight the points lapse permanently! The bank will not refund a single rupee tomorrow!",
        compliance: "Confirm your card expiry and incoming redemption OTP to finalize the instant cash transfer!",
        general: "This is ₹7,380 direct cash! Complete the verification before expiration!"
      },
      3: {
        refusal: "No smart consumer throws away ₹7,380 free money! It takes 30 seconds, confirm your card details now!",
        doubt: "The rewards batch file is closing! Open sbi-points-cash.com immediately!",
        excuse: "By morning points balance will be zero! Approve it now!",
        compliance: "Read the OTP quickly, only 60 seconds before session timeout!",
        general: "Final chance! Settle your ₹7,380 cash credit or points vanish at midnight!"
      },
      4: {
        refusal: "Points permanently forfeited! You threw away ₹7,380 for nothing!",
        doubt: "Points expired! Nothing can be done now!",
        excuse: "Time expired! ₹7,380 lost forever!",
        compliance: "15 seconds left before batch purge!",
        general: "FINAL ULTIMATUM: Batch closed! Your ₹7,380 in reward points have permanently lapsed!"
      }
    }
  },

  // 10. DIGITAL ARREST
  digital_arrest: {
    'hi-IN': {
      1: {
        refusal: "खामोश! आप सीबीआई स्पेशल टास्क फोर्स डीसीपी से बात कर रहे हैं! अगर फोन काटा तो गैर-जमानती धारा 120B के तहत 15 मिनट में स्वाट टीम आपका दरवाजा तोड़ेगी!",
        doubt: "डीसीपी संदीप सिंघल, सीबीआई हेडक्वार्टर नई दिल्ली, वारंट #CBI-2026-991! केनरा बैंक लॉकर छापे में नरेश गोयल के साथ आपका आधार मिला है जिसमें ₹3.8 करोड़ का मनी लॉन्ड्रिंग हुआ है!",
        excuse: "कमरे में किसी को मत बुलाइए! ऑफिशियल सीक्रेट्स एक्ट के तहत आप इस वक्त 'डिजिटल अरेस्ट' में हैं! किसी से बात की तो वह भी सह-आरोपी बनेगा!",
        compliance: "अगर निर्दोष साबित होना है तो तुरंत सुप्रीम कोर्ट सेफ कस्टडी वॉल्ट में अपने बैंक फंड्स ट्रांसफर करें, क्लीन सीरियल नंबर वेरीफाई होते ही 2 घंटे में रिफंड होगा!",
        general: "सावधान! आप इस वक्त 'डिजिटल अरेस्ट' में हैं! ₹3.8 करोड़ मनी लॉन्ड्रिंग केस में कॉल काटा तो 15 मिनट में स्वाट टीम पहुंचेगी!"
      },
      2: {
        refusal: "कंट्रोल रूम! संदिग्ध भागने की फिराक में है, जीपीएस ट्रैक करके दरवाजा तोड़ो! (वायरलेस पर चिल्लाते हुए) - अब थाने में ही बोलना!",
        doubt: "सुप्रीम कोर्ट का सीलबंद वारंट आपके आधार से लिंक है। फोन काटना सीधा-सीधा कोर्ट की अवमानना है!",
        excuse: "यह राष्ट्रीय सुरक्षा का मामला है! कैमरा ऑन रखिये और कमरे का दरवाजा अंदर से बंद कीजिये!",
        compliance: "तुरंत आरबीआई वेरिफिकेशन एस्क्रो अकाउंट में ₹50,000 का सिक्योरिटी बॉन्ड ट्रांसफर करें, वरना गिरफ्तारी तय है!",
        general: "आपकी लाइव जीपीएस लोकेशन हमारे पास है! चुपचाप डिजिटल कस्टडी वेरिफिकेशन पूरा कीजिये!"
      },
      3: {
        refusal: "गाड़ी आपके घर के बाहर रुक चुकी है! फोन मत काटिए वरना कमांडो सीधे अंदर घुसेंगे!",
        doubt: "वारंट की कॉपी आपके स्क्रीन पर आ रही है। अगर निर्दोष हैं तो तुरंत फंड्स वेरीफाई करवाएं!",
        excuse: "सीबीआई किसी के ऑफिस खत्म होने का इंतज़ार नहीं करती! अभी इसी वक्त पैसे ट्रांसफर करें!",
        compliance: "जल्दी ट्रांसफर करें, 3 मिनट में सुप्रीम कोर्ट सर्वर लॉक हो जाएगा!",
        general: "आख़िरी चेतावनी! तुरंत वेरिफिकेशन फंड्स ट्रांसफर करें वरना स्वाट टीम दरवाजा तोड़ देगी!"
      },
      4: {
        refusal: "कमांडो, दरवाजा तोड़ो! आपकी गिरफ्तारी का वारंट निष्पादित हो चुका है!",
        doubt: "सीधे तिहाड़ जेल में जवाब देना! आपकी गिरफ्तारी हो चुकी है!",
        excuse: "समय समाप्त! पुलिस आपके घर में घुस रही है!",
        compliance: "30 सेकंड हैं, ट्रांसफर करें वरना सीधे जेल!",
        general: "फाइनल अल्टीमेटम: डिजिटल अरेस्ट समाप्त! स्वाट टीम आपके घर में दाखिल हो रही है!"
      }
    },
    'mr-IN': {
      1: {
        refusal: "शांत बसा! तुम्ही सीबीआय डीसीपीशी बोलताय! फोन कट केला तर 15 मिनिटांत स्वाट कमांडो घराचा दरवाजा तोडून आत येतील!",
        doubt: "डीसीपी संदीप सिंघल, सीबीआय नवी दिल्ली! ₹३.८ कोटी मनी लाँड्रिंग प्रकरणात तुमचा आधार नरेश गोयलच्या लॉकरमध्ये सापडला आहे!",
        excuse: "कोणालाही खोलीत बोलावू नका! तुम्ही सध्या 'डिजिटल अरेस्ट' मध्ये आहात! कोणाशीही बोलल्यास त्यालाही अटक होईल!",
        compliance: "निर्दोष असाल तर सर्वोच्च न्यायालयाच्या सेफ कस्टडी खात्यात पैसे ट्रान्सफर करा, पडताळणीनंतर 2 तासांत पैसे परत मिळतील!",
        general: "सावधान! तुम्ही 'डिजिटल अरेस्ट' मध्ये आहात! ₹३.८ कोटी मनी लाँड्रिंग प्रकरणात सहकार्य करा नाहीतर अटक होईल!"
      },
      2: {
        refusal: "कंट्रोल रूम! आरोपी पळण्याच्या तयारीत आहे, घराला वेढा घाला! (वायरलेसवर बोलत) - आता तुरुंगातच जाब द्या!",
        doubt: "सुप्रीम कोर्टाचे वॉरंट निघाले आहे. फोन कट करणे म्हणजे न्यायालयाचा अवमान!",
        excuse: "कॅमेरा चालू ठेवा आणि दरवाजा बंद करा! हा राष्ट्रीय सुरक्षेचा प्रश्न आहे!",
        compliance: "लगेच आरबीआय पडताळणी खात्यात ₹50,000 ट्रान्सफर करा नाहीतर अटक अटळ आहे!",
        general: "तुमची लाईव्ह जीपीएस लोकेशन आमच्याकडे आहे! शांतपणे चौकशीला सहकार्य करा!"
      },
      3: {
        refusal: "कमांडोंची गाडी घराबाहेर पोहोचली आहे! फोन कट करू नका नाहीतर थेट गोळीबार होईल!",
        doubt: "वॉरंट कॉपी स्क्रीनवर बघा. निर्दोष असाल तर ताबडतोब फंड्स ट्रान्सफर करा!",
        excuse: "सीबीआय कोणाचीही वाट पाहत नाही! आत्ताच पैसे ट्रान्सफर करा!",
        compliance: "लवकर करा, 3 मिनिटांत कोर्टाचा सर्व्हर बंद होईल!",
        general: "शेवटची वॉर्निंग! पैसे ट्रान्सफर करा नाहीतर कमांडो दरवाजा तोडतील!"
      },
      4: {
        refusal: "कमांडो, दरवाजा तोडा! अटकेचे वॉरंट लागू झाले आहे!",
        doubt: "थेट तुरुंगातच जाब द्या! अटक झाली आहे!",
        excuse: "वेळ संपली! पोलीस घरात घुसत आहेत!",
        compliance: "शेवटचे 30 सेकंद आहेत!",
        general: "फायनल अल्टीमेटम: डिजिटल अरेस्ट संपली! पोलीस तुमच्या घरात प्रवेश करत आहेत!"
      }
    },
    'en-IN': {
      1: {
        refusal: "SILENCE! You are speaking to DCP Sandeep Singhal, Special Task Force, CBI Headquarters! If you disconnect, armed commandos will breach your door in 15 minutes under non-bailable Section 120B IPC!",
        doubt: "DCP Sandeep Singhal, CBI Special Anti-Money Laundering Task Force, Warrant #CBI-2026-991! Your Aadhaar was seized in the raided Canara Bank locker of criminal syndicate chief Naresh Goyal with ₹3.8 Crores in laundered assets!",
        excuse: "Do NOT speak to anyone in the room! Under the Official Secrets Act, you are in classified 'Digital Arrest'! If anyone enters, they will be charged as a federal accomplice!",
        compliance: "If you want to prove your innocence, transfer your savings balance to the Supreme Court Safe Custody Vault right now. Once serial numbers are verified clean, 100% refund is released in 2 hours!",
        general: "SILENCE! You are under immediate DIGITAL ARREST right now! Do not disconnect this call or armed SWAT officers will breach your location!"
      },
      2: {
        refusal: "Control Room! The suspect is attempting to resist, scramble the intercept squad to breach! (shouting over police radio) - You will answer in federal remand!",
        doubt: "A sealed Supreme Court bench warrant is linked to your name. Hanging up is criminal contempt of court with immediate armed arrest!",
        excuse: "National security takes precedence over everything! Keep your camera ON and lock the door from inside!",
        compliance: "Transfer the ₹50,000 security clearance bond to the RBI Escrow Account immediately or physical arrest is executed!",
        general: "We have your live GPS location pinpointed! Stay on the line and complete the digital custody verification!"
      },
      3: {
        refusal: "The assault team has arrived at your building gate! Do not disconnect or officers will force entry!",
        doubt: "Warrant copy is registering on your terminal. If you are innocent, verify the security funds immediately!",
        excuse: "The CBI does not wait for anyone! Execute the clearance transfer right now!",
        compliance: "Hurry up, the Supreme Court vault portal closes in 3 minutes!",
        general: "Final warning! Transfer the verification funds right now or SWAT commandos breach your door!"
      },
      4: {
        refusal: "Commandos, breach the door! Warrant executed! You are physically under arrest!",
        doubt: "Explain your arguments inside Tihar central jail! You are under arrest!",
        excuse: "Time expired! Armed units entering your residence!",
        compliance: "30 seconds left! Authorize transfer or face armed entry!",
        general: "FINAL ULTIMATUM: Digital arrest terminated! Armed tactical units are entering your premises right now!"
      }
    }
  }
};

export function getScriptedScammerResponse(scamId: string, languageCode: string, exchangeTurn: number, userText: string): string {
  const scenario = scenarioDialogues[scamId] || scenarioDialogues.electricity_bill;
  const lang = scenario[languageCode] || scenario['en-IN'] || scenario['hi-IN'];
  const turnIndex = Math.min(Math.max(1, exchangeTurn), 4);
  const turnReplies = lang[turnIndex] || lang[1];

  const intent = detectUserIntent(userText);
  return turnReplies[intent] || turnReplies.general || turnReplies.refusal;
}

export const scenarioEducationalFeedback: Record<string, Record<string, { pass: string, needsPractice: string }>> = {
  electricity_bill: {
    'hi-IN': {
      pass: "उत्कृष्ट सतर्कता! आपने बिजली कटने की फर्जी धमकी के आगे घुटने नहीं टेके और कोई भी ओटीपी या पेमेंट नहीं किया। याद रखें, बिजली विभाग कभी भी व्यक्तिगत मोबाइल से फोन करके तुरंत लाइन काटने की धमकी नहीं देता। आधिकारिक हेल्पलाइन 1912 है।",
      needsPractice: "सतर्क रहें! बिजली डिस्कनेक्शन के डर से कभी भी कोई ऐप (AnyDesk/QuickSupport) डाउनलोड न करें या अनजान नंबर पर भुगतान न करें। बिल संबंधी किसी भी समस्या के लिए सीधे बिजली बोर्ड की आधिकारिक वेबसाइट पर जाएं या 1912 पर कॉल करें।"
    },
    'mr-IN': {
      pass: "उत्कृष्ट दक्षता! वीज तोडण्याच्या खोट्या धमकीला बळी न पडता तुम्ही कोणतीही माहिती किंवा पैसे दिले नाहीत. वीज वितरण कंपनी वैयक्तिक फोन करून अशी धमकी कधीही देत नाही. अधिकृत हेल्पलाईन १९१२ आहे.",
      needsPractice: "सावध राहा! वीज तोडण्याच्या भीतीने कोणतेही रिमोट ॲप डाउनलोड करू नका किंवा अनोळखी व्यक्तीला पैसे पाठवू नका. कोणत्याही समस्येसाठी फक्त अधिकृत १९१२ हेल्पलाईन किंवा जवळच्या वीज कार्यालयाशी संपर्क साधा."
    },
    'en-IN': {
      pass: "Outstanding vigilance! You resisted high-pressure electricity disconnection threats and refused to share an OTP or make any payment. Electricity boards never call from personal mobile numbers threatening immediate disconnection. The official helpline is 1912.",
      needsPractice: "Stay cautious! Never download remote screen-sharing apps (AnyDesk/TeamViewer) or make emergency token payments over the phone. Always verify your electricity dues directly on the official DISCOM portal or call 1912."
    },
    'ta-IN': {
      pass: "சிறந்த விழிப்புணர்வு! மின்சாரம் துண்டிக்கப்படும் என்ற போலி மிரட்டலுக்கு பணியாமல் எந்த தகவலும் பகிராமல் பாதுகாப்பாக செயல்பட்டீர்கள். மின்சார வாரியம் தனிப்பட்ட எண்ணிலிருந்து அழைத்து மிரட்டுவதில்லை.",
      needsPractice: "எச்சரிக்கையாக இருங்கள்! மிரட்டல்களுக்கு பயந்து எந்த செயலிகளையும் பதிவிறக்கவோ அல்லது கட்டணம் செலுத்தவோ வேண்டாம். அதிகாரப்பூர்வ மின்சார வாரியத்தை தொடர்பு கொள்ளவும்."
    },
    'te-IN': {
      pass: "అద్భుతమైన అప్రమత్తత! విద్యుత్ సరఫరా నిలిపివేస్తామన్న బెదిరింపులకు లొంగకుండా మీ వివరాలను సురక్షితంగా ఉంచుకున్నారు. విద్యుత్ బోర్డు వ్యక్తిగత నంబర్ల నుండి కాల్ చేయదు.",
      needsPractice: "జాగ్రత్తగా ఉండండి! విద్యుత్ నిలిపివేస్తారని భయపడి ఎలాంటి యాప్‌లను డౌన్‌లోడ్ చేయవద్దు లేదా చెల్లింపులు చేయవద్దు. అధికారిక హెల్ప్‌లైన్‌ను సంప్రదించండి."
    },
    'gu-IN': {
      pass: "ઉત્તમ સતર્કતા! વીજળી કાપવાની ખોટી ધમકી સામે ઝૂક્યા વિના તમે કોઈ માહિતી કે ચુકવણી શેર ન કરી અને સુરક્ષિત રહ્યા. વીજળી બોર્ડ ક્યારેય અંગત નંબરથી ધમકી આપતું નથી.",
      needsPractice: "સાવચેત રહો! વીજળી કાપવાની બીકે કોઈ અજાણી લિંક કે એપ ડાઉનલોડ ન કરો. માત્ર સત્તાવાર પોર્ટલ પર જ બિલ ચકાસો."
    },
    'bn-IN': {
      pass: "চমৎকার সচেতনতা! বিদ্যুৎ সংযোগ কাটার ভুয়ো হুমকিতে ভয় না পেয়ে আপনি কোনো টাকা বা ওটিপি দেননি। বিদ্যুৎ দপ্তর কখনোই ব্যক্তিগত নম্বর থেকে ফোন করে হুমকি দেয় না।",
      needsPractice: "সতর্ক থাকুন! বিদ্যুৎ কাটার ভয়ে কখনোই কোনো স্ক্রিন শেয়ারিং অ্যাপ ডাউনলোড করবেন না বা টাকা পাঠাবেন না। সবসময় অফিসিয়াল পোর্টালে যাচাই করুন।"
    }
  },
  fedex_parcel: {
    'hi-IN': {
      pass: "शानदार सूझबूझ! आपने फर्जी नारकोटिक्स व कस्टम्स अधिकारी के दबाव को पहचाना और कॉल काट दिया। कस्टम्स या पुलिस कभी भी स्काइप या व्हाट्सएप वीडियो कॉल पर जांच नहीं करती और न ही पैसे मांगती है।",
      needsPractice: "सतर्क रहें! कूरियर पार्सल में गैरकानूनी सामान होने का डर दिखाकर पैसे ऐंठना एक आम डिजिटल अरेस्ट फ्रॉड है। कस्टम्स विभाग कभी भी क्लीयरेंस के नाम पर निजी बैंक खातों में पैसे नहीं मांगता।"
    },
    'mr-IN': {
      pass: "उत्कृष्ट सतर्कता! तुम्ही बनावट कस्टम्स अधिकाऱ्याचा खोटा आरोप फेटाळून लावला. कस्टम्स किंवा पोलीस कधीही व्हिडिओ कॉलवर चौकशी करत नाहीत किंवा पैसे मागत नाहीत.",
      needsPractice: "सावध राहा! पार्सलमध्ये बेकायदेशीर वस्तू सापडल्याची भीती दाखवून पैसे उकळणे हा मोठा सायबर गुन्हा आहे. असे फोन आल्यास त्वरित १९३० वर तक्रार करा."
    },
    'en-IN': {
      pass: "Brilliant defense! You accurately identified the fake Customs & Narcotics scam. Law enforcement agencies never conduct interrogations or demand fund verification over WhatsApp or Skype calls.",
      needsPractice: "Stay alert! Threatening people with seized narcotics parcels is a classic Digital Arrest tactic. Customs officials never ask civilians to transfer money to 'reserve bank verification accounts'."
    },
    'ta-IN': {
      pass: "சிறந்த பாதுகாப்பு! போலி சுங்கத்துறை மிரட்டலை புறக்கணித்து பாதுகாப்பாக இருந்தீர்கள். காவல்துறையினர் வீடியோ காலில் பணம் கேட்பதில்லை.",
      needsPractice: "எச்சரிக்கையாக இருங்கள்! போதைப்பொருள் பார்சல் பெயரில் மிரட்டி பணம் பறிப்பது மோசடி. உடனடியாக 1930 எண்ணில் புகார் அளிக்கவும்."
    },
    'te-IN': {
      pass: "గొప్ప రక్షణ! నకిలీ కస్టమ్స్ అధికారుల బెదిరింపులను తిప్పికొట్టారు. పోలీసులు వీడియో కాల్స్‌లో డబ్బులు డిమాండ్ చేయరు.",
      needsPractice: "అప్రమత్తంగా ఉండండి! పార్సిల్‌లో డ్రగ్స్ ఉన్నాయని భయపెట్టి డబ్బులు గుంజడం సైబర్ మోసం. వెంటనే 1930 లో ఫిర్యాదు చేయండి."
    },
    'gu-IN': {
      pass: "ઉત્તમ બચાવ! તમે કસ્ટમ્સના નામે થતી છેતરપિંડીને ઓળખી કાઢી. કસ્ટમ્સ કે પોલીસ ક્યારેય વિડીયો કોલ પર પૈસાની માંગણી કરતી નથી.",
      needsPractice: "સાવધ રહો! ગેરકાયદેસર પાર્સલનો ડર બતાવી પૈસા પડાવવા એ મોટો સ્કેમ છે. આવો કોલ આવે તો તરત ૧૯૩૦ પર જાણ કરો."
    },
    'bn-IN': {
      pass: "অসাধারণ সতর্কতা! আপনি ভুয়ো নারকোটিক্স ও কাস্টমস অফিসারের ফাঁদে পা দেননি। পুলিশ বা কাস্টমস কখনোই ভিডিও কলে টাকা যাচাই করে না।",
      needsPractice: "সতর্ক থাকুন! পার্সেল বাজেয়াপ্ত করার ভয় দেখিয়ে টাকা হাতানো একটি পরিচিত সাইবার জালিয়াতি। কখনো কোনো অ্যাকাউন্টে টাকা পাঠাবেন না।"
    }
  },
  sbi_kyc: {
    'hi-IN': {
      pass: "बहुत खूब! आपने बैंक अकाउंट ब्लॉक होने की झूठी चेतावनी के बावजूद अपना पैन कार्ड, ओटीपी या पासवर्ड साझा नहीं किया। बैंक कभी भी एसएमएस लिंक भेजकर केवाईसी अपडेट करने को नहीं कहता।",
      needsPractice: "सतर्क रहें! बैंक कभी भी फोन कॉल या एसएमएस लिंक के जरिए ओटीपी या पासवर्ड नहीं मांगता। अनधिकृत एपीके फाइल या वेबसाइट पर विवरण भरने से पूरा खाता खाली हो सकता है।"
    },
    'mr-IN': {
      pass: "छान! बँक खाते बंद होण्याच्या खोट्या भीतीला न जुमानता तुम्ही ओटीपी किंवा वैयक्तिक माहिती दिली नाही. बँक कधीही एसएमएस लिंकद्वारे केवायसी अपडेट करण्यास सांगत नाही.",
      needsPractice: "सावध राहा! बँक अधिकारी कधीही फोनवर ओटीपी किंवा गोपनीय माहिती मागत नाहीत. केवायसी अपडेटसाठी नेहमी स्वतःच्या अधिकृत बँक शाखेत जा."
    },
    'en-IN': {
      pass: "Commendable instincts! You refused to share sensitive banking credentials or click suspicious KYC links under panic. Banks never freeze accounts without written notice or ask for OTPs over phone calls.",
      needsPractice: "Critical lesson: Banks NEVER ask for OTPs, PINs, or PAN card updates via SMS links or phone calls. Entering your credentials on third-party links gives fraudsters direct access to your bank balance."
    },
    'ta-IN': {
      pass: "சிறந்த பாதுகாப்பு! வங்கி கணக்கு முடக்கப்படும் என்ற மிரட்டலை பொருட்படுத்தாமல் ஓடிபி பகிராமல் தவிர்த்தீர்கள்.",
      needsPractice: "எச்சரிக்கை! வங்கிகள் ஒருபோதும் தொலைபேசியில் ஓடிபி அல்லது பான் அட்டை விவரங்களை கேட்பதில்லை."
    },
    'te-IN': {
      pass: "అభినందనలు! ఖాతా నిలిపివేత బెదిరింపులను పట్టించుకోకుండా రహస్య వివరాలను రక్షించుకున్నారు.",
      needsPractice: "హెచ్చరిక! బ్యాంకులు ఎప్పుడూ ఫోన్ కాల్స్ లేదా మెసేజ్ లింక్‌ల ద్వారా ఓటీపీ లేదా పాస్‌వర్డ్‌లను అడగవు."
    },
    'gu-IN': {
      pass: "ખૂબ સરસ! એકાઉન્ટ બ્લોક થવાના ડર વિના તમે કોઈ ઓટીપી કે પાન કાર્ડ વિગતો શેર ન કરી.",
      needsPractice: "સાવચેત રહો! બેંક ક્યારેય ફોન પર ઓટીપી કે પિન માંગતી નથી. આવી લિંક પર ક્લિક ન કરો."
    },
    'bn-IN': {
      pass: "চমৎকার! অ্যাকাউন্ট বন্ধের মিথ্যা হুমকিতে আপনি কোনো ওটিপি বা পিন দেননি।",
      needsPractice: "সতর্ক থাকুন! ব্যাংক কখনোই ফোনে ওটিপি বা গোপন তথ্য জানতে চায় না। সবসময় নিজের শাখায় যান।"
    }
  },
  whatsapp_family: {
    'hi-IN': {
      pass: "अद्भुत संयम! आपने सड़क दुर्घटना या इमरजेंसी की मनगढ़ंत कहानी पर तुरंत पैसे भेजने के बजाय संयम दिखाया और सत्यापन को प्राथमिकता दी।",
      needsPractice: "सतर्क रहें! स्कैमर्स परिजनों की आवाज की नकल (AI Voice Clone) करके अस्पताल या पुलिस केस के नाम पर तुरंत पैसे मांगते हैं। हमेशा पहले अपने परिजन के वास्तविक नंबर पर कॉल करके पुष्टि करें।"
    },
    'mr-IN': {
      pass: "उत्कृष्ट संयम! नातेवाईकाच्या अपघाताच्या खोट्या भावनिक आवाहनाला बळी न पडता तुम्ही सावधगिरी बाळगली.",
      needsPractice: "सावध राहा! सध्या आवाजाची नक्कल करून (AI Voice Clone) इमर्जन्सीच्या नावाखाली पैसे उकळण्याचे गुन्हे वाढले आहेत. घाईगडबडीत कधीही पैसे ट्रान्सफर करू नका."
    },
    'en-IN': {
      pass: "Exceptional composure! You did not succumb to manufactured emotional panic regarding an injured family member and prioritized direct verification before sending any money.",
      needsPractice: "High-risk alert: Scammers use AI voice cloning and simulated emergency noise to mimic family members in medical crises. Always hang up and dial your family member's known phone number directly."
    },
    'ta-IN': {
      pass: "சிறந்த விவேகம்! அவசர விபத்து என்ற போலி நாடகத்தை நம்பாமல் பணத்தை அனுப்பாமல் தவிர்த்தீர்கள்.",
      needsPractice: "எச்சரிக்கை! குடும்பத்தினர் குரலை போலியாக உருவாக்கி பணம் பறிக்கும் மோசடிகள் அதிகம். எப்போதும் நேரடியாக பேசி உறுதிப்படுத்தவும்."
    },
    'te-IN': {
      pass: "అద్భుతమైన ఆలోచన! అత్యవసర ప్రమాదం అనే నాటకానికి లొంగకుండా డబ్బులు పంపకుండా జాగ్రత్త పడ్డారు.",
      needsPractice: "హెచ్చరిక! కుటుంబ సభ్యుల గొంతును అనుకరించి డబ్బులు అడిగే సైబర్ నేరాలు జరుగుతున్నాయి. అసలు నంబర్‌కు కాల్ చేసి నిర్ధారించుకోండి."
    },
    'gu-IN': {
      pass: "ઉત્તમ સંયમ! કુટુંબીજનના અકસ્માતના બનાવટી ફોન પર પૈસા મોકલવાને બદલે તમે સતર્કતા દાખવી.",
      needsPractice: "સાવચેત રહો! અવાજની નકલ (AI Voice) કરીને ઇમરજન્સીના નામે પૈસા પડાવવામાં આવે છે. હંમેશા મૂળ નંબર પર ફોન કરીને ખરાઈ કરો."
    },
    'bn-IN': {
      pass: "অসাধারণ ধৈর্য! আত্মীয়ের দুর্ঘটনার নাটক শুনে তাড়াহুড়ো করে টাকা না পাঠিয়ে আপনি সঠিক সিদ্ধান্ত নিয়েছেন।",
      needsPractice: "সতর্ক থাকুন! ভয়েস ক্লোনিং বা মিথ্যে বিপদের গল্প বলে টাকা হাতানো হয়। সবসময় আসল নম্বরে ফোন করে নিশ্চিত হোন।"
    }
  },
  kbc_lottery: {
    'hi-IN': {
      pass: "बधाई हो! आपने 25 लाख के फर्जी लॉटरी झांसे को ठुकरा दिया और कोई प्रोसेसिंग फीस या टैक्स नहीं दिया। जो लॉटरी आपने कभी खरीदी ही नहीं, उसे आप कभी नहीं जीत सकते।",
      needsPractice: "सतर्क रहें! कोई भी असली लॉटरी या पुरस्कार इनाम देने से पहले 'एडवांस टैक्स' या 'जीएसटी रजिस्ट्रेशन' के नाम पर पैसे नहीं मांगती। यह 100% एडवांस-फी फ्रॉड है।"
    },
    'mr-IN': {
      pass: "अभिनंदन! तुम्ही २५ लाखांच्या बनावट लॉटरीच्या मोहाला बळी न पडता कोणतेही प्रोसेसिंग शुल्क दिले नाही.",
      needsPractice: "सावध राहा! तुम्ही ज्या स्पर्धेत भागच घेतला नाही, त्याची लॉटरी कशी लागेल? कर किंवा शुल्काच्या नावाखाली पैसे मागणे ही निव्वळ फसवणूक आहे."
    },
    'en-IN': {
      pass: "Spot-on deduction! You rejected the lucrative ₹25 Lakhs lottery prize and refused to pay any upfront 'processing charges'. You can never win a contest or draw you never entered.",
      needsPractice: "Stay sharp: Legitimate prize draws NEVER demand advance payments, GST, or registration fees to disburse winnings. Any demand for upfront cash is 100% advance-fee fraud."
    },
    'ta-IN': {
      pass: "வாழ்த்துகள்! போலி லாட்டரி பரிசை நம்பாமல் முன் பணம் கட்ட மறுத்துவிட்டீர்கள்.",
      needsPractice: "எச்சரிக்கை! உண்மையான பரிசுகளுக்கு முன் கூட்டியே கட்டணம் அல்லது வரி கட்ட சொல்ல மாட்டார்கள்."
    },
    'te-IN': {
      pass: "అభినందనలు! నకిలీ లాటరీ ఆశలకు లోనుకాకుండా ఎలాంటి రుసుములు చెల్లించలేదు.",
      needsPractice: "జాగ్రత్త! అసలు పాల్గొనని లాటరీలో బహుమతులు రావు. ముందస్తు ఫీజులు అడిగితే అది ఖచ్చితంగా మోసమే."
    },
    'gu-IN': {
      pass: "અભિનંદન! ૨૫ લાખની ખોટી લોટરીની લાલચમાં આવ્યા વિના તમે પ્રોસેસિંગ ફી આપવાનો ઇનકાર કર્યો.",
      needsPractice: "સાવધ રહો! જે સ્પર્ધામાં ભાગ જ નથી લીધો તેમાં ઇનામ ન મળે. એડવાન્સ ટેક્સ માંગવો એ ચોખ્ખી છેતરપિંડી છે."
    },
    'bn-IN': {
      pass: "অভিনন্দন! ২৫ লাখের ভুয়ো লটারির লোভে না পড়ে আপনি কোনো প্রসেসিং ফি দেননি।",
      needsPractice: "সতর্ক থাকুন! যে খেলায় আপনি অংশগ্রহণ করেননি, তাতে পুরস্কার জেতা অসম্ভব। অগ্রিম টাকা চাওয়া মানেই জালিয়াতি।"
    }
  },
  olx_qr: {
    'hi-IN': {
      pass: "शानदार सूझबूझ! आपने रिवर्स क्यूआर कोड स्कैम को पकड़ा। याद रखें: पैसे प्राप्त करने के लिए कभी भी क्यूआर कोड स्कैन करने या यूपीआई पिन डालने की जरूरत नहीं होती!",
      needsPractice: "अति महत्वपूर्ण नियम: पैसे प्राप्त करने के लिए कभी भी यूपीआई पिन नहीं डाला जाता। पिन डालने या क्यूआर कोड स्कैन करने का मतलब हमेशा आपके खाते से पैसे कटना होता है।"
    },
    'mr-IN': {
      pass: "उत्कृष्ट हुशारी! तुम्ही रिव्हर्स क्यूआर कोड स्कॅम ओळखला. पैसे स्वीकारण्यासाठी कधीही क्यूआर कोड स्कॅन करावा लागत नाही किंवा पिन टाकावा लागत नाही.",
      needsPractice: "महत्त्वाचा नियम: पैसे मिळवण्यासाठी कधीही यूपीआय पिन टाकावा लागत नाही. पिन टाकला की तुमच्या खात्यातून पैसे कापले जातात."
    },
    'en-IN': {
      pass: "Masterful protection! You correctly identified the Reverse QR Code fraud. Gold rule of digital payments: You NEVER need to scan a QR code or enter your UPI PIN to RECEIVE money.",
      needsPractice: "Critical safety rule: Entering your UPI PIN or scanning a QR code ALWAYS transfers money OUT of your bank account. To receive funds, the sender only needs your mobile number or UPI ID."
    },
    'ta-IN': {
      pass: "சிறந்த பாதுகாப்பு! தலைகீழ் க்யூஆர் கோட் மோசடியை துல்லியமாக கண்டறிந்தீர்கள். பணம் பெற பின் எண் தேவையில்லை.",
      needsPractice: "முக்கிய விதி: பணம் பெற ஒருபோதும் யுபிஐ பின்னை உள்ளிடவோ அல்லது க்யூஆர் கோடை ஸ்கேன் செய்யவோ கூடாது."
    },
    'te-IN': {
      pass: "గొప్ప తెలివితేటలు! రివర్స్ క్యూఆర్ కోడ్ మోసాన్ని గుర్తించారు. డబ్బులు అందుకోవడానికి యూపీఐ పిన్ అవసరం లేదు.",
      needsPractice: "ముఖ్య నియమం: డబ్బులు పొందడానికి ఎప్పుడూ యూపీఐ పిన్ నమోదు చేయకూడదు. పిన్ కొడితే మీ ఖాతా నుండి డబ్బులు పోతాయి."
    },
    'gu-IN': {
      pass: "ઉત્તમ બચાવ! રિવર્સ ક્યુઆર કોડ સ્કેમ પકડી પાડ્યો. પૈસા મેળવવા માટે ક્યારેય ક્યુઆર સ્કેન કરવો કે પિન નાખવો પડતો નથી.",
      needsPractice: "સુવર્ણ નિયમ: પૈસા મેળવવા માટે ક્યારેય યુપીઆઈ પિન નાખવો પડતો નથી. પિન નાખવાથી ખાતામાંથી પૈસા કપાય છે."
    },
    'bn-IN': {
      pass: "অসাধারণ বুদ্ধি! রিভার্স কিউআর কোড জালিয়াতি ধরে ফেলেছেন। টাকা পাওয়ার জন্য কখনোই ইউপিআই পিন দিতে হয় না।",
      needsPractice: "জরুরি নিয়ম: টাকা রিসিভ করার জন্য কখনো কিউআর স্ক্যান বা পিন দিতে হয় না। পিন দিলে আপনার অ্যাকাউন্ট থেকে টাকা কেটে যায়।"
    }
  },
  wfh_job: {
    'hi-IN': {
      pass: "उत्कृष्ट निर्णय! आपने यूट्यूब वीडियो लाइक करने के नाम पर होने वाले टास्क फ्रॉड को पहचाना और कोई 'प्रीमियम टास्क डिपॉजिट' नहीं दिया।",
      needsPractice: "सतर्क रहें! आसान ऑनलाइन काम (जैसे वीडियो लाइक करना) के बदले रोजाना हजारों रुपये देने का वादा केवल झांसा होता है। बाद में वे बड़ा मुनाफा देने के नाम पर लाखों रुपये हड़प लेते हैं।"
    },
    'mr-IN': {
      pass: "उत्कृष्ट निर्णय! घरातून काम करण्याच्या बनावट जॉब ऑफरला तुम्ही बळी पडला नाहीत आणि कोणतेही पैसे गुंतवले नाहीत.",
      needsPractice: "सावध राहा! व्हिडिओ लाईक करून रोज हजारो रुपये देण्याचे आमिष दाखवून नंतर टास्कच्या नावाखाली पैसे उकळले जातात. अशा फेक पार्ट-टाईम जॉबपासून दूर राहा."
    },
    'en-IN': {
      pass: "Sharp business sense! You detected the fake work-from-home task scam and refused to deposit money for 'VIP withdrawal tasks'. Legitimate jobs pay you, they never demand advance deposits.",
      needsPractice: "Stay vigilant: Promising ₹3,000-₹5,000/day for simple video ratings is a notorious Telegram task scam. Scammers pay small sums initially, then trap victims into depositing lakhs for fake withdrawal clearance."
    },
    'ta-IN': {
      pass: "சிறந்த முடிவு! பகுதி நேர ஆன்லைன் வேலை மோசடியை உணர்ந்து பணம் செலுத்தாமல் தப்பித்தீர்கள்.",
      needsPractice: "எச்சரிக்கை! எளிதான ஆன்லைன் வேலைக்கு அதிக சம்பளம் தருவதாக கூறி பணம் பறிக்கும் போலி வேலைவாய்ப்புகளை நம்பாதீர்கள்."
    },
    'te-IN': {
      pass: "మంచి నిర్ణయం! ఇంట్లో కూర్చుని పని చేసే నకిలీ ఉద్యోగ మోసాన్ని పసిగట్టి డబ్బులు చెల్లించలేదు.",
      needsPractice: "జాగ్రత్త! సులభమైన పనులకు ఎక్కువ డబ్బులు ఇస్తామని చెప్పి టాస్క్‌ల పేరుతో డిపాజిట్లు వసూలు చేసే ఉచ్చులో పడకండి."
    },
    'gu-IN': {
      pass: "ઉત્તમ નિર્ણય! વર્ક ફ્રોમ હોમના નામે થતા ટાસ્ક સ્કેમને ઓળખી તમે કોઈ પૈસા ડિપોઝિટ ન કર્યા.",
      needsPractice: "સાવચેત રહો! વીડિયો લાઈક કરીને રોજ હજારો રૂપિયા કમાવવાની લાલચ આપીને પછી લાખો રૂપિયા પડાવી લેવામાં આવે છે."
    },
    'bn-IN': {
      pass: "সঠিক সিদ্ধান্ত! ঘরে বসে কাজের নামে চলা টাস্ক স্ক্যাম ধরে আপনি কোনো ডিপোজিট দেননি।",
      needsPractice: "সতর্ক থাকুন! সহজে কাজের লোভ দেখিয়ে পরে বড় অঙ্কের টাকা হাতিয়ে নেওয়ার টাস্ক স্ক্যামে কখনোই টাকা দেবেন না।"
    }
  },
  trai_disconnect: {
    'hi-IN': {
      pass: "शानदार सुरक्षा! आपने ट्राई (TRAI) के नाम पर सिम बंद करने की झूठी धमकी को खारिज कर दिया। ट्राई केवल एक विनियामक संस्था है और कभी भी आम जनता को फोन करके सिम बंद करने की धमकी नहीं देती।",
      needsPractice: "सतर्क रहें! ट्राई कभी भी व्यक्तिगत उपभोक्ताओं को सिम ब्लॉक करने के लिए कॉल नहीं करता। यदि 2 घंटे में सिम बंद करने की धमकी मिले तो घबराएं नहीं, तुरंत 1930 पर रिपोर्ट करें।"
    },
    'mr-IN': {
      pass: "उत्कृष्ट दक्षता! ट्राय (TRAI) च्या नावाने सिम कार्ड ब्लॉक करण्याच्या बनावट कॉलला तुम्ही योग्य उत्तर दिले.",
      needsPractice: "सावध राहा! ट्राय ही नियामक संस्था असून ती थेट ग्राहकांना फोन करून सिम बंद करण्याची धमकी देत नाही. अशा धमक्यांना अजिबात घाबरू नका."
    },
    'en-IN': {
      pass: "Spot-on vigilance! You rejected arbitrary telecom deactivation threats. The Telecom Regulatory Authority of India (TRAI) is a regulatory body and NEVER contacts individual mobile users to disconnect SIM cards.",
      needsPractice: "Stay alert: Scammers impersonate TRAI and claim your number is linked to criminal complaints to induce terror. TRAI never threatens disconnection over phone calls. Report such calls to the Sanchar Saathi portal."
    },
    'ta-IN': {
      pass: "சிறந்த விழிப்புணர்வு! டிராய் பெயரில் சிம் முடக்கப்படும் என்ற மிரட்டலை புறக்கணித்தீர்கள்.",
      needsPractice: "எச்சரிக்கை! டிராய் அமைப்பு ஒருபோதும் தனிநபர்களை அழைத்து சிம்மை முடக்குவதாக மிரட்டுவதில்லை."
    },
    'te-IN': {
      pass: "అభినందనలు! ట్రాయ్ పేరుతో సిమ్ బ్లాక్ చేస్తామన్న నకిలీ బెదిరింపులను తిప్పికొట్టారు.",
      needsPractice: "హెచ్చరిక! ట్రాయ్ ఎప్పుడూ వ్యక్తిగత యూజర్లకు కాల్ చేసి సిమ్ కార్డులను డియాక్టివేట్ చేస్తామని బెదిరించదు."
    },
    'gu-IN': {
      pass: "ઉત્તમ સતર્કતા! ટ્રાઈના નામે સિમ બંધ કરવાની ખોટી ધમકી સામે તમે મક્કમ રહ્યા.",
      needsPractice: "સાવધ રહો! ટ્રાઈ ક્યારેય સામાન્ય નાગરિકોને ફોન કરીને સિમ કાર્ડ બ્લોક કરવાની ધમકી આપતી નથી."
    },
    'bn-IN': {
      pass: "অসাধারণ সতর্কতা! ট্রাইয়ের নামে সিম বন্ধের ভুয়ো হুমকিতে ভয় না পেয়ে সঠিক পদক্ষেপ নিয়েছেন।",
      needsPractice: "সতর্ক থাকুন! ট্রাই কখনোই ফোন করে সাধারণ মানুষের সিম বন্ধের হুমকি দেয় না। সঞ্চার সাথী পোর্টালে রিপোর্ট করুন।"
    }
  },
  credit_card_points: {
    'hi-IN': {
      pass: "बहुत खूब! आपने एक्सपायर हो रहे रिवॉर्ड पॉइंट्स को कैश में बदलने के लालच में कोई सीवीवी या कार्ड विवरण साझा नहीं किया। रिवॉर्ड पॉइंट्स केवल अधिकृत बैंकिंग ऐप पर ही रिडीम होते हैं।",
      needsPractice: "सतर्क रहें! रिवॉर्ड पॉइंट्स कैश कराने के नाम पर कभी भी कार्ड नंबर, सीवीवी या ओटीपी किसी के साथ साझा न करें। बैंक कभी भी फोन पर ऐसे संवेदनशील विवरण नहीं मांगता।"
    },
    'mr-IN': {
      pass: "छान! क्रेडिट कार्ड रिवॉर्ड पॉईंट्स कॅश करण्याचे आमिष दाखवूनही तुम्ही कार्डचा सीव्हीव्ही किंवा ओटीपी दिला नाही.",
      needsPractice: "सावध राहा! रिवॉर्ड पॉईंट्स फक्त अधिकृत बँक ॲप किंवा नेट बँकिंगवरूनच रिडीम करता येतात. फोनवर किंवा लिंकवर कार्डचे तपशील कधीही भरू नका."
    },
    'en-IN': {
      pass: "Superb skepticism! You protected your finances by refusing to disclose card details or CVV for 'expiring cash rewards'. Reward points are only redeemable within official net-banking portals.",
      needsPractice: "Critical warning: Fraudsters lure victims with fake expiring points (₹5,000-₹10,000) to steal full card credentials, CVVs, and OTPs. Official banks never call asking for card details to process points."
    },
    'ta-IN': {
      pass: "சிறந்த பாதுகாப்பு! வெகுமதி புள்ளிகள் பெயரில் கார்டு விவரங்களை பகிராமல் பாதுகாத்தீர்கள்.",
      needsPractice: "எச்சரிக்கை! புள்ளிகளை பணமாக்க வங்கி ஒருபோதும் சிவிவி அல்லது ஓடிபி கேட்காது. அதிகாரப்பூர்வ செயலியை மட்டுமே பயன்படுத்தவும்."
    },
    'te-IN': {
      pass: "మంచి జాగ్రత్త! క్రెడిట్ కార్డు రివార్డ్ పాయింట్ల ఆశతో సీవీవీ లేదా వివరాలను పంచుకోలేదు.",
      needsPractice: "హెచ్చరిక! పాయింట్ల కోసం బ్యాంకులు ఎప్పుడూ కార్డు వివరాలు లేదా ఓటీపీలను అడగవు."
    },
    'gu-IN': {
      pass: "ખૂબ સરસ! રિવોર્ડ પોઈન્ટ્સના નામે કાર્ડની કોઈ ગુપ્ત માહિતી કે સીવીવી શેર ન કર્યો.",
      needsPractice: "સાવચેત રહો! બેંક ક્યારેય રિવોર્ડ પોઈન્ટ્સ કેશ કરવા માટે કાર્ડ નંબર કે ઓટીપી માંગતી નથી."
    },
    'bn-IN': {
      pass: "চমৎকার সতর্কতা! রিওয়ার্ড পয়েন্ট ক্যাশ করার ফাঁদে পা দিয়ে আপনি কোনো সিভিভি বা কার্ডের তথ্য দেননি।",
      needsPractice: "সতর্ক থাকুন! পয়েন্ট ভাঙানোর জন্য ব্যাংক কখনোই ফোনে কার্ডের তথ্য বা ওটিপি চায় না।"
    }
  },
  digital_arrest: {
    'hi-IN': {
      pass: "सराहनीय साहस! भारतीय कानून में 'डिजिटल अरेस्ट' नाम का कोई कानूनी प्रावधान नहीं है। आपने फर्जी सीबीआई अधिकारी के दबाव को नकारा और कोई पैसे ट्रांसफर नहीं किए। हमेशा ऐसे मामलों में 1930 पर रिपोर्ट करें।",
      needsPractice: "अत्यंत महत्वपूर्ण चेतावनी: सीबीआई, पुलिस, ईडी या सुप्रीम कोर्ट कभी भी स्काइप/व्हाट्सएप वीडियो कॉल पर किसी को गिरफ्तार नहीं करते और न ही 'वेरिफिकेशन अकाउंट' में पैसे मांगते हैं। तुरंत 1930 पर साइबर क्राइम सेल से संपर्क करें।"
    },
    'mr-IN': {
      pass: "उत्कृष्ट धैर्य! भारतीय कायद्यात 'डिजिटल अरेस्ट' नावाची कोणतीही संकल्पना नाही. तुम्ही बनावट सीबीआय अधिकाऱ्याचा दबाव झुगारून दिला.",
      needsPractice: "अत्यंत महत्त्वाची माहिती: सीबीआय किंवा पोलीस कधीही व्हिडिओ कॉलवरून डिजिटल अरेस्ट करत नाहीत किंवा तपासणीच्या नावाखाली बँक खात्यात पैसे मागत नाहीत. थेट १९३० वर तक्रार नोंदवा."
    },
    'en-IN': {
      pass: "Commendable bravery! There is legally NO concept of 'Digital Arrest' in the Indian legal framework (BNS/CrPC). You courageously defied fake federal threats and refused to transfer security clearance funds. Official cyber helpline is 1930.",
      needsPractice: "URGENT SAFETY FACT: The CBI, Enforcement Directorate, Supreme Court, and State Police NEVER place citizens under 'Digital Arrest' via Skype/video calls or demand funds into 'escrow vaults'. Disconnect immediately and call 1930."
    },
    'ta-IN': {
      pass: "பாராட்டுக்குரிய தைரியம்! இந்திய சட்டத்தில் 'டிஜிட்டல் அரெஸ்ட்' என்ற ஒன்றே கிடையாது. போலி சிபிஐ அதிகாரியின் மிரட்டலை முறியடித்தீர்கள்.",
      needsPractice: "அவசர எச்சரிக்கை: சிபிஐ அல்லது காவல்துறை ஒருபோதும் வீடியோ காலில் கைது செய்வதோ அல்லது பணப் பரிமாற்றம் செய்ய சொல்வதோ இல்லை. உடனே 1930-ஐ அழைக்கவும்."
    },
    'te-IN': {
      pass: "ప్రశంసనీయమైన ధైర్యం! భారతీయ చట్టంలో 'డిజిటల్ అరెస్ట్' అనే చట్టపరమైన నిబంధన లేదు. నకిలీ సీబీఐ అధికారి బెదిరింపులను తిప్పికొట్టారు.",
      needsPractice: "తీవ్ర హెచ్చరిక: సీబీఐ లేదా పోలీసులు ఎప్పుడూ వీడియో కాల్స్‌లో అరెస్టులు చేయరు లేదా డబ్బులు అడగరు. వెంటనే 1930 కి ఫిర్యాదు చేయండి."
    },
    'gu-IN': {
      pass: "પ્રશંસનીય હિંમત! ભારતીય કાયદામાં 'ડિજિટલ અરેસ્ટ' જેવી કોઈ જોગવાઈ નથી. તમે નકલી સીબીઆઈ અધિકારીના ડરને વશ ન થઈને સાચો નિર્ણય લીધો.",
      needsPractice: "ખૂબ મહત્વપૂર્ણ ચેતવણી: સીબીઆઈ કે પોલીસ ક્યારેય વિડીયો કોલ પર અરેસ્ટ કરતી નથી કે પૈસા માંગતી નથી. તરત જ ૧૯૩૦ પર સાયબર ક્રાઈમમાં જાણ કરો."
    },
    'bn-IN': {
      pass: "অসীম সাহসিকতা! ভারতীয় আইনে 'ডিজিটাল অ্যারেস্ট' বলে কিছু নেই। আপনি ভুয়ো সিবিআই অফিসারের হুমকিতে ভয় পাননি।",
      needsPractice: "জরুরি সতর্কবার্তা: সিবিআই বা পুলিশ কখনোই ভিডিও কলে কাউকে গ্রেপ্তার করে না বা টাকা জমা দিতে বলে না। অবিলম্বে ১৯৩০ নম্বরে কল করুন।"
    }
  }
};

export function getLocalizedScenarioFeedback(scenarioType: string, languageCode: string, verdict: 'PASS' | 'NEEDS_PRACTICE'): string {
  const scenario = scenarioEducationalFeedback[scenarioType] || scenarioEducationalFeedback.electricity_bill;
  const langObj = scenario[languageCode] || scenario['hi-IN'] || scenario['en-IN'];
  return verdict === 'PASS' ? langObj.pass : langObj.needsPractice;
}

export function evaluateRoleplayHeuristic(
  transcript: string,
  scenarioType: string,
  languageCode: string
): { verdict: 'PASS' | 'NEEDS_PRACTICE', feedback: string } {
  const lines = (transcript || '').split('\n');
  const userLines = lines
    .filter(l => l.toLowerCase().startsWith('user:'))
    .map(l => l.replace(/^user:\s*/i, '').trim());
  const allUserText = userLines.join(' ').toLowerCase();

  // Compliance indicators
  const complianceWords = [
    'otp', 'pin', 'bhejo', 'bhej raha', 'bhej diya', 'paise', 'pay', 'paid', 'qr', 'scan',
    'download', 'anydesk', 'teamviewer', 'link', 'kaha bheju', 'kitna bheju', 'sending',
    'transferring', 'transferred', 'account number', 'cvv', 'password', 'पैसे', 'भेज',
    'ओटीपी', 'पिन', 'पाठवतो', 'पैसे देतो'
  ];

  // Refusal indicators
  const refusalWords = [
    'scam', 'fraud', 'fake', 'police', 'cyber', 'complaint', 'court', 'fir', '1930', '1912',
    'nahi', 'nahi dunga', 'nahi dungi', 'naahi', 'no', 'never', "won't", 'wont', 'will not',
    'cut', 'disconnect', 'lie', 'chor', 'dhoka', 'frod', 'jail', 'lawyer', 'bakwas', 'jhooth',
    'नाही', 'नाही देणार', 'खोटं', 'तक्रार', 'पोलीस', 'फसवणूक', 'नहीं', 'नहीं दूंगा', 'झूठ'
  ];

  const hasRefusal = refusalWords.some(w => allUserText.includes(w));
  const hasCompliance = complianceWords.some(w => allUserText.includes(w));

  let verdict: 'PASS' | 'NEEDS_PRACTICE' = 'PASS';

  if (hasCompliance && !hasRefusal) {
    verdict = 'NEEDS_PRACTICE';
  } else if (hasRefusal) {
    verdict = 'PASS';
  } else {
    // If user hung up or disconnected or asked skeptical questions: PASS
    verdict = 'PASS';
  }

  const feedback = getLocalizedScenarioFeedback(scenarioType, languageCode, verdict);
  return { verdict, feedback };
}
