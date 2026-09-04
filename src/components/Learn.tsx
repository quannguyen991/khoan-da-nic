import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  ShieldAlert, 
  ShieldCheck, 
  Phone, 
  PhoneCall, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Sparkles, 
  ChevronRight, 
  Copy, 
  Check, 
  Award,
  Landmark,
  Users,
  Laptop,
  Gift,
  MailWarning,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EMERGENCY_NUMBERS, SCAM_LESSONS, ScamLesson } from '../data/scamData';
import { NHAN, tra } from '../catalog';
import { ViewState } from '../App';

interface LearnProps {
  setView: (v: ViewState) => void;
  t: (key: string) => string;
  lang?: 'vi' | 'en';
  onTriggerEmergency?: () => void;
}

export function LearnView({ setView, t, lang = 'vi', onTriggerEmergency }: LearnProps) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'emergency'>('lessons');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<ScamLesson | null>(null);
  const [quizState, setQuizState] = useState<{ [lessonId: string]: number | null }>({});
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const lessons = useMemo(() => {
    return SCAM_LESSONS[lang] || SCAM_LESSONS.vi;
  }, [lang]);

  const emergencyContacts = useMemo(() => {
    return EMERGENCY_NUMBERS[lang] || EMERGENCY_NUMBERS.vi;
  }, [lang]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        item.title.toLowerCase().includes(q) || 
        item.shortDesc.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q)) ||
        item.scenario.story.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [lessons, selectedCategory, searchQuery]);

  const handleCopy = (phone: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const getLessonIcon = (type: ScamLesson['iconType']) => {
    switch (type) {
      case 'shield-alert': return <ShieldAlert className="w-6 h-6 text-red-500" />;
      case 'landmark': return <Landmark className="w-6 h-6 text-indigo-500" />;
      case 'users': return <Users className="w-6 h-6 text-purple-500" />;
      case 'laptop': return <Laptop className="w-6 h-6 text-blue-500" />;
      case 'gift': return <Gift className="w-6 h-6 text-amber-500" />;
      case 'mail-warning': return <MailWarning className="w-6 h-6 text-rose-500" />;
      default: return <BookOpen className="w-6 h-6 text-purple-500" />;
    }
  };

  const categories = [
    { id: 'all', label: lang === 'en' ? 'All Tactics' : 'Tất cả chiêu trò', icon: '✨' },
    { id: 'impersonation', label: lang === 'en' ? 'Law & Gov' : 'Giả mạo Công an', icon: '👮' },
    { id: 'bank', label: lang === 'en' ? 'Bank & Finance' : 'Ngân hàng & Tiền', icon: '🏦' },
    { id: 'family', label: lang === 'en' ? 'Family & Emergency' : 'Cấp cứu người thân', icon: '👨‍👩‍👧' },
    { id: 'tech', label: lang === 'en' ? 'Malware & Tech' : 'Mã độc & App giả', icon: '📱' },
    { id: 'job_reward', label: lang === 'en' ? 'Jobs & Prizes' : 'Việc làm & Quà tặng', icon: '🎁' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col w-full relative z-10 p-4 sm:p-6 overflow-y-auto pb-28 md:pb-12 max-w-5xl mx-auto"
    >
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pt-2 mb-4">
        <button aria-label={t("Quay lại")} 
          onClick={() => {
            stopSpeaking();
            setView('home');
          }}
          className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center text-[#4c1d95] shadow-xs border-2 border-[#2e1065] active:scale-95 transition-transform"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="text-center flex-1 px-2">
          <h2 className="font-black text-[#2e1065] text-lg sm:text-xl leading-tight">
            {lang === 'en' ? 'Scam Prevention & Hotline' : 'Cẩm Nang Cảnh Giác & Hotline'}
          </h2>
          <p className="text-[14px] sm:text-[14px] text-purple-700 font-semibold">
            {lang === 'en' ? 'International fraud cases & emergency contacts' : 'Nhận diện bẫy lừa đảo & Số khẩn cấp chuẩn'}
          </p>
        </div>

        <div className="w-10"></div>
      </div>

      {/* Main Mode Toggle: Lessons vs Emergency Numbers */}
      <div className="w-full bg-white/90 p-1.5 rounded-2xl border-2 border-[#2e1065] shadow-xs flex items-center gap-1.5 mb-5">
        <button
          onClick={() => {
            stopSpeaking();
            setActiveTab('lessons');
          }}
          className={`flex-1 py-3 px-3 rounded-2xl font-extrabold text-[14px] sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'lessons'
              ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-sm'
              : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <BookOpen size={17} />
          {/*
            ⚠️ NHÃN NGẮN, VÀ BỎ HẲN CON SỐ ĐẾM.

            Ảnh người dùng gửi 20/8/2026: nhãn "Hotlines & Authorities" dài tới
            mức vỡ ra thành "Authoritie" / "s" trên hai dòng. Tiếng Việt còn dài
            hơn tiếng Anh ~30% (§4.5), nên nhãn nào vừa khít ở một thứ tiếng thì
            vỡ ở thứ tiếng kia.

            Con số "6" bên cạnh cũng đã bỏ: nó không giúp bác quyết định gì —
            bác không chọn thẻ vì nó có 6 hay 9 mục — mà lại chiếm chỗ đúng ở
            chỗ nhãn đang thiếu.
          */}
          <span>{t('Bài học')}</span>
        </button>

        <button
          onClick={() => {
            stopSpeaking();
            setActiveTab('emergency');
          }}
          className={`flex-1 py-3 px-3 rounded-2xl font-extrabold text-[14px] sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'emergency'
              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-red-900 hover:bg-red-50'
          }`}
        >
          <PhoneCall size={17} />
          <span>{t('Số khẩn cấp')}</span>
        </button>
      </div>

      {/* TAB 1: SCAM LESSONS */}
      {activeTab === 'lessons' && (
        <div className="w-full space-y-4">
          {/* Search bar */}
          <div className="relative flex items-center bg-white rounded-2xl p-1.5 pl-3 pr-2 shadow-xs border-2 border-[#2e1065] focus-within:ring-2 ring-purple-400">
            <Search size={18} className="text-purple-500 mr-2 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? 'Search scams (e.g., IRS, bank OTP, crypto, deepfake)...' : 'Tìm kiếm chiêu trò (ví dụ: công an, OTP, VNeID, trúng thưởng)...'}
              className="flex-1 bg-transparent border-none outline-none py-2 text-slate-900 font-medium text-[14px] sm:text-sm placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[14px] text-purple-600 font-bold px-2 py-1 rounded-lg hover:bg-purple-50"
              >
                {lang === 'en' ? 'Clear' : 'Xóa'}
              </button>
            )}
          </div>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-2xl text-[14px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                    isSelected
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-purple-50 border-2 border-[#2e1065]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Alert Banner for Golden Rule */}
          <div className="w-full bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl p-4 border border-amber-200/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#2e1065]">
                {lang === 'en' ? 'Rule 1 of Defense: The 60-Second Safe Pause' : 'Quy tắc vàng 1: Dừng lại 60 giây'}
              </h4>
              <p className="text-[14px] text-slate-600 mt-0.5 leading-relaxed">
                {lang === 'en' 
                  ? 'Whenever pressured to transfer funds, share SMS OTP, or download an app, immediately hang up and pause for 60 seconds before making decisions.' 
                  : 'Bất cứ khi nào bị hối thúc chuyển tiền gấp, đọc mã OTP hay cài app lạ, bác hãy nhớ: CÚP MÁY VÀ DỪNG LẠI 60 GIÂY để hỏi con cháu hoặc kiểm tra an toàn.'}
              </p>
            </div>
          </div>

          {/* Lesson Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {filteredLessons.map((lesson) => {
              const hasCompletedQuiz = quizState[lesson.id] !== undefined && quizState[lesson.id] !== null;
              const isDangerHigh = lesson.dangerLevel === 'CAO';

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLesson(lesson);
                    stopSpeaking();
                  }}
                  className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border-2 border-[#2e1065] hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                >
                  <div>
                    {/* Top Row: Icon, Danger Level & Read Time */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                          {getLessonIcon(lesson.iconType)}
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[14px] font-extrabold flex items-center gap-1 ${
                          isDangerHigh ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isDangerHigh ? <AlertOctagon size={11} /> : <AlertTriangle size={11} />}
                          {/*
                            ⚠️ §4.1 — NHÃN NGUYÊN VĂN, TRA TỪ CATALOG.
                            Bản trước mã cứng 'NGUY CƠ CAO' / 'NGHI VẤN', hai
                            chữ không có trong §4.1. Bài học dùng chung ba enum
                            với đường phân tích, nên nếu chữ ở đây khác chữ ở
                            màn kết quả thì bác học một bộ từ và gặp một bộ khác.
                          */}
                          {tra(NHAN, lesson.dangerLevel, lang) ?? lesson.dangerLevel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[14px] text-slate-400 font-medium">
                        <span>{lesson.readTime}</span>
                        {hasCompletedQuiz && (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[14px]" title="Đã làm bài tập">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-slate-900 text-[15px] sm:text-[16px] leading-snug group-hover:text-purple-700 transition-colors mb-1.5">
                      {lesson.title}
                    </h3>

                    {/* Short Description */}
                    <p className="text-[14px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {lesson.shortDesc}
                    </p>
                  </div>

                  {/* Tags & Action Button */}
                  <div className="pt-2 border-t border-purple-50 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {lesson.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-[14px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <span className="text-[14px] font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {lang === 'en' ? 'View Details' : 'Xem chi tiết'}
                      <ChevronRight size={15} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLessons.length === 0 && (
            <div className="w-full bg-white rounded-3xl p-8 text-center border-2 border-[#2e1065] shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
                <Search size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                {lang === 'en' ? 'No lessons matching your search' : 'Không tìm thấy bài học phù hợp'}
              </h4>
              <p className="text-[14px] text-slate-500 mt-1">
                {lang === 'en' ? 'Try searching for other keywords like "bank", "IRS", or "crypto".' : 'Bác hãy thử tìm từ khóa khác như "công an", "mã OTP", hoặc "Zalo".'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMERGENCY NUMBERS (VIETNAM & INTERNATIONAL) */}
      {activeTab === 'emergency' && (
        <div className="w-full space-y-4">
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <PhoneCall size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg">
                  {lang === 'en' ? 'Verified Emergency Hotlines' : 'Đường Dây Nóng Khẩn Cấp Chuẩn'}
                </h3>
                <p className="text-[14px] text-red-100">
                  {lang === 'en' ? 'Official numbers for reporting scams and seeking protection' : 'Các số điện thoại chính thức được nhà nước & pháp luật bảo hộ'}
                </p>
              </div>
            </div>
            <p className="text-[14px] text-red-100 leading-relaxed">
              {lang === 'en'
                ? 'Tip: If an unknown caller threatens you or demands money, hang up immediately and report to the official hotlines below.'
                : 'Mẹo an toàn: Cơ quan nhà nước không bao giờ gọi điện yêu cầu chuyển tiền. Nếu bị đe dọa, hãy gọi ngay các số bên dưới để được hướng dẫn.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border-2 border-[#2e1065] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[14px] font-extrabold border ${contact.badgeColor}`}>
                        {contact.tag}
                      </span>
                      <h4 className="font-black text-slate-900 text-base sm:text-lg mt-1.5 leading-tight">
                        {contact.name}
                      </h4>
                      <p className="text-[14px] text-purple-700 font-bold mt-0.5">{contact.agency}</p>
                    </div>

                    <span className="text-[14px] font-extrabold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                      {contact.country}
                    </span>
                  </div>

                  <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
                    {contact.description}
                  </p>
                </div>

                {/* Call & Copy Button Row */}
                <div className="flex items-center gap-2 pt-3 border-t border-purple-50">
                  <a
                    href={`tel:${contact.cleanPhone}`}
                    className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
                  >
                    <Phone size={14} />
                    <span>{lang === 'en' ? `Call ${contact.phone}` : `Gọi ${contact.phone}`}</span>
                  </a>

                  <button
                    onClick={() => handleCopy(contact.cleanPhone)}
                    className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-2xl transition-colors shrink-0"
                    title={lang === 'en' ? 'Copy phone number' : 'Sao chép số'}
                  >
                    {copiedPhone === contact.cleanPhone ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick family trigger option */}
          {onTriggerEmergency && (
            <div className="w-full bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between mt-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-[14px] font-bold text-amber-900">
                  {lang === 'en' ? 'Need to stop an ongoing transaction right now?' : 'Bác đang bị thúc ép chuyển tiền và cần báo động khẩn cấp?'}
                </span>
              </div>
              <button
                onClick={onTriggerEmergency}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-[14px] font-bold shrink-0 transition-colors"
              >
                {lang === 'en' ? 'Trigger 60s Alert' : 'Báo động 60s'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: LESSON DETAIL & QUIZ */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-[#fbf9ff] rounded-3xl shadow-2xl border-2 border-[#2e1065] overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-white border-b border-purple-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                    {getLessonIcon(selectedLesson.iconType)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[14px] font-extrabold uppercase tracking-wide text-purple-700 block">
                      {selectedLesson.category}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                      {selectedLesson.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const fullReadText = `${selectedLesson.title}. Tình huống: ${selectedLesson.scenario.story}. Dấu hiệu nhận biết: ${selectedLesson.redFlags.join('. ')}. Cách xử lý: ${selectedLesson.goldenRules.join('. ')}`;
                      speakText(fullReadText);
                    }}
                    className={`p-2.5 rounded-2xl transition-colors flex items-center gap-1 text-[14px] font-bold ${
                      isSpeaking ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                    title={isSpeaking ? 'Dừng đọc' : 'Đọc bài học cho bác'}
                  >
                    {isSpeaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    <span className="hidden sm:inline">{isSpeaking ? 'Dừng' : 'Đọc'}</span>
                  </button>

                  <button
                    onClick={() => {
                      stopSpeaking();
                      setSelectedLesson(null);
                    }}
                    className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
                {/* Story / Scenario */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#2e1065] shadow-xs">
                  <h4 className="font-bold text-[14px] uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
                    <Users size={15} />
                    {lang === 'en' ? 'Simulated Scenario' : 'Tình Huống Thực Tế'}
                  </h4>
                  <p className="text-[14px] sm:text-sm text-slate-700 leading-relaxed mb-3">
                    {selectedLesson.scenario.story}
                  </p>

                  {/* Scammer Quote */}
                  <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-xl p-3 text-[14px] text-rose-950 italic">
                    <span className="font-bold not-italic block text-rose-700 mb-0.5">
                      {lang === 'en' ? 'Typical Scammer Line:' : 'Lời kẻ lừa đảo thường nói:'}
                    </span>
                    {selectedLesson.scenario.scammerQuote}
                  </div>
                </div>

                {/* Red Flags */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-red-100 shadow-xs">
                  <h4 className="font-bold text-[14px] uppercase tracking-wider text-red-700 mb-2.5 flex items-center gap-1.5">
                    <AlertOctagon size={15} />
                    {lang === 'en' ? 'Critical Red Flags' : 'Dấu Hiệu Nhận Biết Bẫy Lừa'}
                  </h4>
                  <ul className="space-y-2">
                    {selectedLesson.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[14px] sm:text-sm text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[14px] shrink-0 mt-0.5">
                          ✕
                        </span>
                        <span className="leading-snug">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Golden Rules */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-xs">
                  <h4 className="font-bold text-[14px] uppercase tracking-wider text-emerald-800 mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck size={15} />
                    {lang === 'en' ? 'Khoan Đã Defense Actions' : 'Hành Động Chuẩn Xác Của Bác'}
                  </h4>
                  <ul className="space-y-2">
                    {selectedLesson.goldenRules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[14px] sm:text-sm text-emerald-950 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interactive Practice Quiz */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#2e1065] shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    <h4 className="font-extrabold text-sm text-[#2e1065]">
                      {lang === 'en' ? 'Quick Reflex Quiz' : 'Câu Hỏi Luyện Tập Phản Xạ'}
                    </h4>
                  </div>
                  
                  <p className="text-[14px] sm:text-sm text-slate-800 font-bold mb-3">
                    {selectedLesson.quiz.question}
                  </p>

                  <div className="space-y-2">
                    {selectedLesson.quiz.options.map((opt, optIdx) => {
                      const selectedIdx = quizState[selectedLesson.id];
                      const isSelected = selectedIdx === optIdx;
                      const hasAnswered = selectedIdx !== undefined && selectedIdx !== null;

                      let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-purple-50';
                      if (hasAnswered) {
                        if (opt.isCorrect) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isSelected && !opt.isCorrect) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                        } else {
                          btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                        }
                      }

                      return (
                        <div key={optIdx} className="space-y-1">
                          <button
                            disabled={hasAnswered}
                            onClick={() => {
                              setQuizState(prev => ({ ...prev, [selectedLesson.id]: optIdx }));
                            }}
                            className={`w-full p-3 rounded-2xl border text-left text-[14px] sm:text-sm transition-all flex items-start gap-2.5 ${btnStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[14px] shrink-0 mt-0.5">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-snug">{opt.text}</span>
                          </button>

                          {hasAnswered && (isSelected || opt.isCorrect) && (
                            <p className={`text-[14px] px-3 py-1 rounded-lg ${
                              opt.isCorrect ? 'text-emerald-700 bg-emerald-50/60 font-semibold' : 'text-rose-700 bg-rose-50/60'
                            }`}>
                              {opt.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {quizState[selectedLesson.id] !== undefined && quizState[selectedLesson.id] !== null && (
                    <div className="mt-3 pt-3 border-t border-purple-50 flex items-center justify-between">
                      <span className="text-[14px] font-bold text-emerald-700 flex items-center gap-1">
                        <Award size={15} />
                        {lang === 'en' ? 'Reflex practice recorded!' : 'Đã ghi nhận phản xạ an toàn!'}
                      </span>
                      <button
                        onClick={() => {
                          setQuizState(prev => ({ ...prev, [selectedLesson.id]: null }));
                        }}
                        className="text-[14px] font-bold text-purple-700 hover:underline"
                      >
                        {lang === 'en' ? 'Retry Quiz' : 'Làm lại'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-purple-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    stopSpeaking();
                    setSelectedLesson(null);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white rounded-2xl font-bold text-[14px] sm:text-sm shadow-xs active:scale-95 transition-transform text-center"
                >
                  {lang === 'en' ? 'Done & Return' : 'Bác đã hiểu và nắm rõ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
