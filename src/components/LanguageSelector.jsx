import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentLanguage, t } from '../i18n/locales';
import './LanguageSelector.css';

function LanguageSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Extract language from URL path
  const getLangFromPath = (path) => {
    const match = path.match(/^\/(en|vi)(\/|$)/);
    return match ? match[1] : 'vi'; // Default to Vietnamese
  };

  const currentLang = getLangFromPath(location.pathname);

  const handleLanguageSelect = (lang) => {
    if (lang === currentLang) {
      setIsOpen(false);
      return;
    }
    
    // Update URL with new language prefix
    const currentPath = location.pathname.replace(/^\/(en|vi)/, '') || '/';
    const newPath = `/${lang}${currentPath}`;
    navigate(newPath);
    setIsOpen(false);
  };

  return (
    <div className="language-selector">
      <button
        className="language-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t('lang.select')}
      >
        🌐 {currentLang === 'vi' ? 'VI' : 'EN'}
      </button>
      {isOpen && (
        <>
          <div className="language-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="language-selector-dropdown">
            <button
              className={`language-option ${currentLang === 'vi' ? 'active' : ''}`}
              onClick={() => handleLanguageSelect('vi')}
            >
              🇻🇳 {t('lang.vi', 'vi')}
            </button>
            <button
              className={`language-option ${currentLang === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageSelect('en')}
            >
              🇬🇧 {t('lang.en', 'en')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSelector;
