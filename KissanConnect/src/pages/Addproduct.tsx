import { useState } from 'react';

// Define the language keys as a union type
type Language = 'English' | 'Hindi' | 'Tamil' | 'Kannada' | 'Marathi' | 'Bengali' | 'Malayalam';

const HelpTab = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('English');

  // Step-by-step instructions in multiple languages
  const instructions: Record<Language, string[]> = {
    English: [
      "1. Open the Kissan Property Map by logging into your account.",
      "2. Use the drawing tools on the top left to create plots (rectangle) or buildings (polygon).",
      "3. Click on the map to place markers for property locations.",
      "4. Fill out the property details form that appears after drawing or selecting a marker.",
      "5. Save your changes to store the property data and map features.",
      "6. Edit existing properties by clicking the 'Edit Property' button on the popup.",
      "7. Explore your saved properties by zooming and panning the map."
    ],
    Hindi: [
      "1. अपने खाते में लॉगिन करके किसान प्रॉपर्टी मैप खोलें।",
      "2. ऊपरी बाएँ कोने में ड्रॉइंग टूल्स का उपयोग करके प्लॉट (आयत) या इमारतें (बहुभुज) बनाएँ।",
      "3. मैप पर क्लिक करके प्रॉपर्टी के स्थान के लिए मार्कर रखें।",
      "4. ड्रॉइंग या मार्कर चुनने के बाद दिखाई देने वाले प्रॉपर्टी विवरण फॉर्म को भरें।",
      "5. अपने परिवर्तनों को सहेजें ताकि प्रॉपर्टी डेटा और मैप फीचर्स स्टोर हो जाएँ।",
      "6. मौजूद प्रॉपर्टियों को 'प्रॉपर्टी संपादित करें' बटन पर क्लिक करके संपादित करें।",
      "7. मैप को ज़ूम इन/आउट और पैन करके अपनी सहेजी गई प्रॉपर्टियों का पता लगाएँ।"
    ],
    Tamil: [
      "1. உங்கள் கணக்கில் உள்நுழைந்து கிசான் பிராபர்டி மேப்-ஐ திறக்கவும்.",
      "2. இடது மேற்கோணத்தில் உள்ள வரைதல் கருவிகளைப் பயன்படுத்தி நிலப்பரப்புகள் (சதுரம்) அல்லது கட்டிடங்கள் (பல்கோணம்) உருவாக்கவும்.",
      "3. மேப்-இல் கிளிக் செய்து நிலத்தின் அமைவிடத்திற்கு குறிகாட்டிகளை வைக்கவும்.",
      "4. வரைதல் அல்லது குறிகாட்டியைத் தேர்ந்தெடுத்த பிறகு தோன்றும் நில விவரங்கள் படிவத்தை நிரப்பவும்.",
      "5. உங்கள் மாற்றங்களை சேமித்து நில தரவு மற்றும் மேப் அம்சங்களை சேமிக்கவும்.",
      "6. 'நிலத்தைத் திருத்து' பொத்தானை கிளிக் செய்து உள்ள நிலங்களை திருத்தவும்.",
      "7. மேப்-ஐ ஸ்க்ரோல் செய்து பூகோள அளவை மாற்றி உங்கள் சேமித்த நிலங்களை ஆராயவும்."
    ],
    Kannada: [
      "1. ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ ಮತ್ತು ಕಿಸಾನ್ ಪ್ರಾಪರ್ಟಿ ಮ್ಯಾಪ್ ಅನ್ನು ತೆರೆಯಿರಿ.",
      "2. ಎಡ ಮೇಲೆ ಇರುವ ಡ್ರಾಯಿಂಗ್ ಟೂಲ್ಸ್ ಅನ್ನು ಬಳಸಿ ಗುಣಮಟ್ಟ (ಚತುರಭುಜ) ಅಥವಾ ಕಟ್ಟಡಗಳನ್ನು (ಬಹುಭುಜ) ರಚಿಸಿ.",
      "3. ಮ್ಯಾಪ್‌ನಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ ಪ್ರಾಪರ್ಟಿ ಸ್ಥಳಕ್ಕೆ ಮಾರ್ಕರ್‌ಗಳನ್ನು ಇರಿಸಿ.",
      "4. ಡ್ರಾಯಿಂಗ್ ಅಥವಾ ಮಾರ್ಕರ್ ಆಯ್ಕೆ ಮಾಡಿದ ಬಳಿಕ ತೋರಿಸುವ ಪ್ರಾಪರ್ಟಿ ವಿವರಗಳ ಫಾರ್ಮ್ ಅನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
      "5. ನಿಮ್ಮ ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ ಪ್ರಾಪರ್ಟಿ ಡೇಟಾ ಮತ್ತು ಮ್ಯಾಪ್ ಫೀಚರ್‌ಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ.",
      "6. 'ಪ್ರಾಪರ್ಟಿ ಸಂಪಾದಿಸಿ' ಬಟನ್ ಅನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ಇರುವ ಪ್ರಾಪರ್ಟಿಗಳನ್ನು ಸಂಪಾದಿಸಿ.",
      "7. ಮ್ಯಾಪ್ ಅನ್ನು ಝೂಮ್ ಮಾಡಿ ಮತ್ತು ಪ್ಯಾನ್ ಮಾಡಿ ನಿಮ್ಮ ಸಹೇಜಿದ ಪ್ರಾಪರ್ಟಿಗಳನ್ನು ಅನ್ವೇಷಿಸಿ."
    ],
    Marathi: [
      "1. तुमच्या खात्यात लॉगिन करून किसान प्रॉपर्टी मॅप उघडा.",
      "2. डाव्या वरच्या कोपऱ्यातील ड्रॉइंग साधनांचा वापर करून प्लॉट (आयत) किंवा इमारती (बहुभुज) बनवा.",
      "3. मॅपवर क्लिक करून प्रॉपर्टीच्या ठिकाणी मार्कर ठेवा.",
      "4. ड्रॉइंग किंवा मार्कर निवडल्यानंतर दिसणाऱ्या प्रॉपर्टी तपशील फॉर्ममध्ये माहिती भरा.",
      "5. तुमचे बदल साठवून प्रॉपर्टी डेटा आणि मॅप वैशिष्ट्ये साठवून ठेवा.",
      "6. 'प्रॉपर्टी संपादित करा' बटणावर क्लिक करून विद्यमान प्रॉपर्टी संपादित करा.",
      "7. मॅपला झूम करा आणि पॅन करा तुमच्या साठवलेल्या प्रॉपर्टींचा शोध घ्या."
    ],
    Bengali: [
      "1. আপনার অ্যাকাউন্টে লগইন করে কিসান প্রপার্টি ম্যাপ খুলুন।",
      "2. বাম উপরের কোণে অঙ্কন সরঞ্জামগুলো ব্যবহার করে প্লট (আয়তক্ষেত্র) বা ভবন (বহুভুজ) তৈরি করুন।",
      "3. ম্যাপে ক্লিক করে প্রপার্টির অবস্থানে মার্কার স্থাপন করুন।",
      "4. অঙ্কন বা মার্কার নির্বাচন করার পর প্রদর্শিত প্রপার্টি বিবরণ ফর্মটি পূরণ করুন।",
      "5. আপনার পরিবর্তনগুলো সংরক্ষণ করে প্রপার্টি ডেটা ও ম্যাপ ফিচারগুলো সংরক্ষণ করুন।",
      "6. 'প্রপার্টি সম্পাদনা করুন' বোতামে ক্লিক করে বিদ্যমান প্রপার্টি সম্পাদনা করুন।",
      "7. ম্যাপে জুম করুন এবং প্যান করুন আপনার সংরক্ষিত প্রপার্টিগুলো অন্বেষণ করুন।"
    ],
    Malayalam: [
      "1. നിന്റെ അക്കൗണ്ടിൽ ലോഗിൻ ചെയ്ത് കിസാൻ പ്രോപ്പർട്ടി മാപ് തുറക്കുക.",
      "2. ഇടത് മുകളിലുള്ള ഡ്രോയിംഗ് ടൂളുകൾ ഉപയോഗിച്ച് പ്ലോട്ടുകൾ (ചതുരം) അല്ലെങ്കിൽ കെട്ടിടങ്ങൾ (ബഹുഭുജം) സൃഷ്ടിക്കുക.",
      "3. മാപ്പിൽ ക്ലിക്ക് ചെയ്ത് പ്രോപ്പർട്ടിയുടെ സ്ഥലത്ത് മാർക്കറുകൾ വയ്ക്കുക.",
      "4. ഡ്രോയിംഗ് അല്ലെങ്കിൽ മാർക്കർ തിരഞ്ഞെടുത്തതിനുശേഷം പ്രത്യക്ഷപ്പെടുന്ന പ്രോപ്പർട്ടി വിവര ഫോം പൂരിപ്പിക്കുക.",
      "5. നിന്റെ മാറ്റങ്ങൾ സേവ് ചെയ്ത് പ്രോപ്പർട്ടി ഡാറ്റയും മാപ് ഫീച്ചറുകളും സംരക്ഷിക്കുക.",
      "6. 'പ്രോപ്പർട്ടി എഡിറ്റ് ചെയ്യുക' ബട്ടൺ ക്ലിക്ക് ചെയ്ത് നിലവിലുള്ള പ്രോപ്പർട്ടികൾ എഡിറ്റ് ചെയ്യുക.",
      "7. മാപ് ജൂം ചെയ്ത് പാൻ ചെയ്ത് നിന്റെ സേവ് ചെയ്ത പ്രോപ്പർട്ടികൾ പര്യവേഷിക്കുക."
    ]
  };

  return (
    <div style={{ padding: '2rem', background: '#c6e2c6', minHeight: 'calc(100vh - 6rem)', color: '#2f4f2f' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Map Usage Instructions</h1>

        {/* Language Dropdown */}
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as Language)}
          style={{
            padding: '0.75rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: '1px solid #e8f5e8',
            background: '#f0fff0',
            color: '#2f4f2f',
            transition: 'all 0.2s',
            outline: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            width: '100%',
            cursor: 'pointer'
          }}
        >
          <option value="English">English</option>
          <option value="Hindi">हिन्दी (Hindi)</option>
          <option value="Tamil">தமிழ் (Tamil)</option>
          <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
          <option value="Marathi">मराठी (Marathi)</option>
          <option value="Bengali">বাংলা (Bengali)</option>
          <option value="Malayalam">മലയാളം (Malayalam)</option>
        </select>

        {/* Step-by-step instructions */}
        <ol style={{ listStyleType: 'decimal', paddingLeft: '2rem', lineHeight: '1.6' }}>
          {instructions[selectedLanguage].map((step: string, index: number) => (
            <li key={index} style={{ marginBottom: '1rem', padding: '0.5rem', background: '#e8f5e8', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default HelpTab;