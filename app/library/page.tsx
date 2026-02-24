"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useEffect } from "react";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";
import { getCurrencyByCountry, formatPrice, currencyInfo } from "@/app/lib/services/currencyService";
import { PlatformMediaItem, subscribeToPlatformSettings } from "@/app/lib/services/firestoreService";

interface Book {
  id: number;
  titleAr: string;
  titleEn: string;
  authorAr: string;
  authorEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceInSAR: number;
  category: string;
  coverImage: string;
  pages: number;
  format: "pdf" | "epub" | "both";
  downloads: number;
  rating: number;
  free: boolean;
}

export default function LibraryPage() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [countryCode, setCountryCode] = useState("SA");
  const [currency, setCurrency] = useState<keyof typeof currencyInfo>("SAR");
  const [activeTab, setActiveTab] = useState<"browse" | "upload" | "manage">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [adminBooks, setAdminBooks] = useState<PlatformMediaItem[]>([]);
  const [adminVideos, setAdminVideos] = useState<PlatformMediaItem[]>([]);

  const [books, setBooks] = useState<Book[]>([
    {
      id: 1,
      titleAr: "شرح العقيدة الطحاوية",
      titleEn: "Explanation of Tahawiyyah Creed",
      authorAr: "الشيخ محمد بن صالح العثيمين",
      authorEn: "Sheikh Muhammad ibn Salih Al-Uthaymin",
      descriptionAr: "شرح مفصل لعقيدة الإمام الطحاوي من أحد أبرز العلماء المعاصرين",
      descriptionEn: "Detailed explanation of Tahawiyyah creed by one of the prominent contemporary scholars",
      priceInSAR: 29,
      category: "aqeedah",
      coverImage: "📚",
      pages: 450,
      format: "both",
      downloads: 1250,
      rating: 4.8,
      free: false
    },
    {
      id: 2,
      titleAr: "مقدمة ابن خلدون",
      titleEn: "Muqaddimah by Ibn Khaldun",
      authorAr: "عبد الرحمن بن محمد ابن خلدون",
      authorEn: "Abdurrahman ibn Muhammad Ibn Khaldun",
      descriptionAr: "أساس علم الاجتماع والعمران، من أهم المقدمات في التاريخ الإسلامي",
      descriptionEn: "Foundation of sociology and civilization studies, one of most important introductions",
      priceInSAR: 0,
      category: "history",
      coverImage: "📖",
      pages: 600,
      format: "pdf",
      downloads: 3400,
      rating: 4.9,
      free: true
    },
    {
      id: 3,
      titleAr: "القاموس المحيط",
      titleEn: "Al-Qamus Al-Muhit",
      authorAr: "مجد الدين محمد بن يعقوب الفيروزآبادي",
      authorEn: "Majd Al-Din Muhammad ibn Ya'qub Al-Fayruzabadi",
      descriptionAr: "قاموس شامل للغة العربية يحتوي على مئات الآلاف من الكلمات",
      descriptionEn: "Comprehensive Arabic dictionary containing hundreds of thousands of words",
      priceInSAR: 49,
      category: "language",
      coverImage: "📕",
      pages: 1250,
      format: "pdf",
      downloads: 890,
      rating: 4.6,
      free: false
    },
    {
      id: 4,
      titleAr: "التفسير الميسر",
      titleEn: "Easy Tafsir",
      authorAr: "مجموعة من المفسرين",
      authorEn: "Group of Scholars",
      descriptionAr: "تفسير سهل الفهم للقرآن الكريم للمبتدئين",
      descriptionEn: "Easy-to-understand Qur'an interpretation for beginners",
      priceInSAR: 0,
      category: "quran",
      coverImage: "🕌",
      pages: 500,
      format: "both",
      downloads: 5600,
      rating: 4.9,
      free: true
    }
  ]);

  const [uploadForm, setUploadForm] = useState({
    titleAr: "",
    titleEn: "",
    authorAr: "",
    authorEn: "",
    descriptionAr: "",
    descriptionEn: "",
    priceInSAR: 0,
    category: "other",
    pages: 0,
    format: "pdf" as const
  });

  const isRTL = userLanguage === "ar";

  const categories = [
    { id: "all", ar: "جميع الفئات", en: "All Categories" },
    { id: "quran", ar: "📖 القرآن الكريم", en: "📖 Quran" },
    { id: "hadith", ar: "📚 السنة النبوية", en: "📚 Hadith" },
    { id: "aqeedah", ar: "✨ العقيدة", en: "✨ Creed" },
    { id: "fiqh", ar: "⚖️ الفقه", en: "⚖️ Islamic Law" },
    { id: "history", ar: "📜 التاريخ", en: "📜 History" },
    { id: "language", ar: "🔤 اللغة", en: "🔤 Language" }
  ];

  useEffect(() => {
    const initLocation = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);

      try {
        const response = await fetch('/api/geolocation');
        const data = await response.json();
        setCountryCode(data.country_code || 'SA');
        const cur = getCurrencyByCountry(data.country_code || 'SA');
        setCurrency(cur);
      } catch (error) {
        console.error('Error getting country:', error);
      }
    };
    initLocation();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToPlatformSettings((settings) => {
      setAdminBooks(settings.library.books || []);
      setAdminVideos(settings.library.videos || []);
    });

    return () => unsubscribe();
  }, []);

  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.titleAr.includes(searchQuery) || 
      book.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorAr.includes(searchQuery) ||
      book.authorEn.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleUploadBook = () => {
    if (!uploadForm.titleAr || !uploadForm.titleEn) {
      alert(userLanguage === "ar" ? "الرجاء ملء العنوان" : "Please enter title");
      return;
    }

    const newBook: Book = {
      id: Math.max(...books.map(b => b.id), 0) + 1,
      ...uploadForm,
      coverImage: "📚",
      downloads: 0,
      rating: 5,
      free: uploadForm.priceInSAR === 0
    };

    setBooks([newBook, ...books]);
    setUploadForm({
      titleAr: "",
      titleEn: "",
      authorAr: "",
      authorEn: "",
      descriptionAr: "",
      descriptionEn: "",
      priceInSAR: 0,
      category: "other",
      pages: 0,
      format: "pdf"
    });

    alert(userLanguage === "ar" 
      ? "تم رفع الكتاب بنجاح!" 
      : "Book uploaded successfully!");
  };

  return (
    <>
      <Navigation />
      <main style={{
        direction: isRTL ? "rtl" : "ltr",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "40px 20px",
      }}>
        <section style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            marginBottom: "30px",
          }}>
            <h1 style={{
              fontSize: "42px",
              color: "#1a3a52",
              marginBottom: "10px",
            }}>
              📚 {userLanguage === "ar" ? "المكتبة الإسلامية" : "Islamic Library"}
            </h1>
            <p style={{
              fontSize: "18px",
              color: "#666",
            }}>
              {userLanguage === "ar"
                ? "مجموعة شاملة من الكتب والمراجع الإسلامية"
                : "Comprehensive collection of Islamic books and references"}
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "30px",
            borderBottom: "2px solid #ddd",
            flexWrap: "wrap",
          }}>
            {(["browse", "upload", "manage"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: activeTab === tab ? "#ffd700" : "transparent",
                  color: activeTab === tab ? "#1a3a52" : "#666",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  borderBottom: activeTab === tab ? "3px solid #1a3a52" : "none",
                }}
              >
                {tab === "browse" && (userLanguage === "ar" ? "📖 تصفح" : "📖 Browse")}
                {tab === "upload" && (userLanguage === "ar" ? "📤 رفع كتاب" : "📤 Upload")}
                {tab === "manage" && (userLanguage === "ar" ? "⚙️ إدارة" : "⚙️ Manage")}
              </button>
            ))}
          </div>

          {(adminBooks.length > 0 || adminVideos.length > 0) && (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "30px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ marginTop: 0, color: "#1a3a52" }}>
                {userLanguage === "ar" ? "📥 إضافات الإدارة" : "📥 Admin Uploads"}
              </h2>
              {adminBooks.length > 0 ? (
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ color: "#1a3a52" }}>{userLanguage === "ar" ? "كتب" : "Books"}</h3>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {adminBooks.map((item) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{ color: "#1a3a52", wordBreak: "break-all" }}>
                        📘 {item.title}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {adminVideos.length > 0 ? (
                <div>
                  <h3 style={{ color: "#1a3a52" }}>{userLanguage === "ar" ? "فيديوهات" : "Videos"}</h3>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {adminVideos.map((item) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{ color: "#1a3a52", wordBreak: "break-all" }}>
                        🎬 {item.title}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Browse Tab */}
          {activeTab === "browse" && (
            <>
              {/* Search and Filter */}
              <div style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "30px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}>
                <input
                  type="text"
                  placeholder={userLanguage === "ar" ? "ابحث عن كتاب أو مؤلف..." : "Search books..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    marginBottom: "15px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />

                <div style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: selectedCategory === cat.id ? "#1a3a52" : "#f0f0f0",
                        color: selectedCategory === cat.id ? "white" : "#1a3a52",
                        border: "none",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      {userLanguage === "ar" ? cat.ar : cat.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Books Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "25px",
                marginBottom: "30px",
              }}>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "0.3s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)")}
                    >
                      <div style={{
                        fontSize: "80px",
                        textAlign: "center",
                        padding: "30px 20px",
                        backgroundColor: "#f5f5f5",
                      }}>
                        {book.coverImage}
                      </div>

                      <div style={{
                        padding: "20px",
                      }}>
                        <h3 style={{
                          fontSize: "16px",
                          color: "#1a3a52",
                          margin: "0 0 5px 0",
                          fontWeight: "bold",
                        }}>
                          {userLanguage === "ar" ? book.titleAr : book.titleEn}
                        </h3>

                        <p style={{
                          fontSize: "12px",
                          color: "#666",
                          margin: "0 0 10px 0",
                        }}>
                          {userLanguage === "ar" ? book.authorAr : book.authorEn}
                        </p>

                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          margin: "10px 0",
                          fontSize: "12px",
                          color: "#999",
                        }}>
                          <span>📄 {book.pages}</span>
                          <span>⬇️ {book.downloads}</span>
                          <span>⭐ {book.rating}</span>
                        </div>

                        <div style={{
                          borderTop: "1px solid #eee",
                          paddingTop: "10px",
                          marginTop: "10px",
                        }}>
                          {book.free ? (
                            <span style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              backgroundColor: "#4CAF50",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}>
                              {userLanguage === "ar" ? "🎁 مجاني" : "🎁 Free"}
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              backgroundColor: "#ffd700",
                              color: "#1a3a52",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}>
                              💰 {formatPrice(book.priceInSAR, currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "40px",
                    color: "#999",
                  }}>
                    {userLanguage === "ar" ? "لم نجد كتباً" : "No books found"}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "40px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              maxWidth: "600px",
              margin: "0 auto",
            }}>
              <h2 style={{
                fontSize: "24px",
                color: "#1a3a52",
                marginBottom: "30px",
                textAlign: "center",
              }}>
                {userLanguage === "ar" ? "📤 رفع كتاب جديد" : "📤 Upload New Book"}
              </h2>

              <input
                type="text"
                placeholder={userLanguage === "ar" ? "العنوان بالعربية" : "Title (Arabic)"}
                value={uploadForm.titleAr}
                onChange={(e) => setUploadForm({ ...uploadForm, titleAr: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              />

              <input
                type="text"
                placeholder={userLanguage === "ar" ? "العنوان بالإنجليزية" : "Title (English)"}
                value={uploadForm.titleEn}
                onChange={(e) => setUploadForm({ ...uploadForm, titleEn: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              />

              <input
                type="text"
                placeholder={userLanguage === "ar" ? "المؤلف بالعربية" : "Author (Arabic)"}
                value={uploadForm.authorAr}
                onChange={(e) => setUploadForm({ ...uploadForm, authorAr: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              />

              <input
                type="text"
                placeholder={userLanguage === "ar" ? "المؤلف بالإنجليزية" : "Author (English)"}
                value={uploadForm.authorEn}
                onChange={(e) => setUploadForm({ ...uploadForm, authorEn: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              />

              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              >
                <option value="quran">📖 {userLanguage === "ar" ? "القرآن" : "Quran"}</option>
                <option value="hadith">📚 {userLanguage === "ar" ? "الحديث" : "Hadith"}</option>
                <option value="aqeedah">✨ {userLanguage === "ar" ? "العقيدة" : "Creed"}</option>
                <option value="fiqh">⚖️ {userLanguage === "ar" ? "الفقه" : "Law"}</option>
                <option value="history">📜 {userLanguage === "ar" ? "التاريخ" : "History"}</option>
              </select>

              <input
                type="number"
                placeholder={userLanguage === "ar" ? "عدد الصفحات" : "Number of pages"}
                value={uploadForm.pages}
                onChange={(e) => setUploadForm({ ...uploadForm, pages: parseInt(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              />

              <input
                type="number"
                placeholder={userLanguage === "ar" ? "السعر (SAR)" : "Price (SAR)"}
                value={uploadForm.priceInSAR}
                onChange={(e) => setUploadForm({ ...uploadForm, priceInSAR: parseInt(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              />

              <textarea
                placeholder={userLanguage === "ar" ? "الوصف بالعربية" : "Description (Arabic)"}
                value={uploadForm.descriptionAr}
                onChange={(e) => setUploadForm({ ...uploadForm, descriptionAr: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />

              <textarea
                placeholder={userLanguage === "ar" ? "الوصف بالإنجليزية" : "Description (English)"}
                value={uploadForm.descriptionEn}
                onChange={(e) => setUploadForm({ ...uploadForm, descriptionEn: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />

              <button
                onClick={handleUploadBook}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#ffd700",
                  color: "#1a3a52",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffed4e")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
              >
                {userLanguage === "ar" ? "رفع الكتاب" : "Upload Book"}
              </button>
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === "manage" && (
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "30px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}>
              <h2 style={{
                fontSize: "24px",
                color: "#1a3a52",
                marginBottom: "20px",
              }}>
                {userLanguage === "ar" ? "⚙️ إدارة الكتب" : "⚙️ Manage Books"}
              </h2>

              <div style={{
                overflowX: "auto",
              }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th style={{
                        padding: "12px",
                        textAlign: isRTL ? "right" : "left",
                        borderBottom: "2px solid #ddd",
                        color: "#1a3a52",
                      }}>
                        {userLanguage === "ar" ? "العنوان" : "Title"}
                      </th>
                      <th style={{
                        padding: "12px",
                        textAlign: isRTL ? "right" : "left",
                        borderBottom: "2px solid #ddd",
                        color: "#1a3a52",
                      }}>
                        {userLanguage === "ar" ? "المؤلف" : "Author"}
                      </th>
                      <th style={{
                        padding: "12px",
                        textAlign: "center",
                        borderBottom: "2px solid #ddd",
                        color: "#1a3a52",
                      }}>
                        {userLanguage === "ar" ? "التحميلات" : "Downloads"}
                      </th>
                      <th style={{
                        padding: "12px",
                        textAlign: "center",
                        borderBottom: "2px solid #ddd",
                        color: "#1a3a52",
                      }}>
                        {userLanguage === "ar" ? "السعر" : "Price"}
                      </th>
                      <th style={{
                        padding: "12px",
                        textAlign: "center",
                        borderBottom: "2px solid #ddd",
                        color: "#1a3a52",
                      }}>
                        {userLanguage === "ar" ? "الإجراءات" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr
                        key={book.id}
                        style={{
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <td style={{ padding: "12px" }}>
                          {userLanguage === "ar" ? book.titleAr : book.titleEn}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {userLanguage === "ar" ? book.authorAr : book.authorEn}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          {book.downloads}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          {book.free ? (userLanguage === "ar" ? "مجاني" : "Free") : `${book.priceInSAR} SAR`}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button style={{
                            padding: "6px 12px",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}>
                            {userLanguage === "ar" ? "حذف" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Book Detail Modal */}
          {selectedBook && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}>
              <div style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "40px",
                maxWidth: "500px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
              }}>
                <div style={{
                  fontSize: "100px",
                  textAlign: "center",
                  marginBottom: "20px",
                }}>
                  {selectedBook.coverImage}
                </div>

                <h2 style={{
                  fontSize: "24px",
                  color: "#1a3a52",
                  marginBottom: "10px",
                  textAlign: "center",
                }}>
                  {userLanguage === "ar" ? selectedBook.titleAr : selectedBook.titleEn}
                </h2>

                <p style={{
                  fontSize: "14px",
                  color: "#666",
                  textAlign: "center",
                  marginBottom: "20px",
                }}>
                  {userLanguage === "ar" ? selectedBook.authorAr : selectedBook.authorEn}
                </p>

                <p style={{
                  fontSize: "14px",
                  color: "#333",
                  lineHeight: "1.6",
                  marginBottom: "20px",
                }}>
                  {userLanguage === "ar" ? selectedBook.descriptionAr : selectedBook.descriptionEn}
                </p>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "20px",
                  padding: "20px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>📄 {userLanguage === "ar" ? "الصفحات" : "Pages"}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1a3a52" }}>{selectedBook.pages}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>⬇️ {userLanguage === "ar" ? "التحميلات" : "Downloads"}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1a3a52" }}>{selectedBook.downloads}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>⭐ {userLanguage === "ar" ? "التقييم" : "Rating"}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1a3a52" }}>{selectedBook.rating}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>{userLanguage === "ar" ? "الصيغة" : "Format"}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1a3a52" }}>{selectedBook.format.toUpperCase()}</div>
                  </div>
                </div>

                <button
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: selectedBook.free ? "#4CAF50" : "#ffd700",
                    color: selectedBook.free ? "white" : "#1a3a52",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginBottom: "10px",
                  }}
                >
                  {selectedBook.free 
                    ? (userLanguage === "ar" ? "⬇️ تحميل مجاني" : "⬇️ Free Download")
                    : (userLanguage === "ar" ? `💰 اشترِ الآن (${selectedBook.priceInSAR} ريال)` : `💰 Buy Now (${selectedBook.priceInSAR} SAR)`)}
                </button>

                <button
                  onClick={() => setSelectedBook(null)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#ddd",
                    color: "#1a3a52",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {userLanguage === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
