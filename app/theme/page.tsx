"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useEffect } from "react";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";

interface Theme {
  id: string;
  nameAr: string;
  nameEn: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export default function ThemePage() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [currentTheme, setCurrentTheme] = useState("default");
  const [customColors, setCustomColors] = useState({
    primaryColor: "#1a3a52",
    secondaryColor: "#ffd700",
    accentColor: "#4caf50",
    backgroundColor: "#f5f5f5",
    textColor: "#333333"
  });

  const [presetThemes] = useState<Theme[]>([
    {
      id: "default",
      nameAr: "الافتراضي (أزرق وذهبي)",
      nameEn: "Default (Blue & Gold)",
      primaryColor: "#1a3a52",
      secondaryColor: "#ffd700",
      accentColor: "#4caf50",
      backgroundColor: "#f5f5f5",
      textColor: "#333333"
    },
    {
      id: "dark",
      nameAr: "الوضع الداكن",
      nameEn: "Dark Mode",
      primaryColor: "#1a1a2e",
      secondaryColor: "#00d4ff",
      accentColor: "#ff006e",
      backgroundColor: "#16213e",
      textColor: "#ffffff"
    },
    {
      id: "green",
      nameAr: "الأخضر الإسلامي",
      nameEn: "Islamic Green",
      primaryColor: "#006b4a",
      secondaryColor: "#ffd700",
      accentColor: "#00a86b",
      backgroundColor: "#f0fdf4",
      textColor: "#1a3a2a"
    },
    {
      id: "sunset",
      nameAr: "الغروب",
      nameEn: "Sunset",
      primaryColor: "#8b3a62",
      secondaryColor: "#ff6b6b",
      accentColor: "#ffa500",
      backgroundColor: "#fff5f0",
      textColor: "#5a3a3a"
    },
    {
      id: "ocean",
      nameAr: "المحيط",
      nameEn: "Ocean",
      primaryColor: "#0066cc",
      secondaryColor: "#00ccff",
      accentColor: "#ff9900",
      backgroundColor: "#f0f8ff",
      textColor: "#003366"
    },
    {
      id: "nature",
      nameAr: "الطبيعة",
      nameEn: "Nature",
      primaryColor: "#2d5016",
      secondaryColor: "#c9a961",
      accentColor: "#6b8e23",
      backgroundColor: "#fffef0",
      textColor: "#3d4a2a"
    }
  ]);

  const isRTL = userLanguage === "ar";

  useEffect(() => {
    const initTheme = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);

      // Load saved theme from localStorage
      const savedTheme = localStorage.getItem("appTheme");
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme);
          setCurrentTheme("custom");
          setCustomColors(theme);
          applyTheme(theme);
        } catch (e) {
          console.error("Error loading saved theme:", e);
        }
      }
    };
    initTheme();
  }, []);

  const applyTheme = (colors: typeof customColors) => {
    // In a real app, this would update CSS variables or theme provider
    document.documentElement.style.setProperty("--primary-color", colors.primaryColor);
    document.documentElement.style.setProperty("--secondary-color", colors.secondaryColor);
    document.documentElement.style.setProperty("--accent-color", colors.accentColor);
    document.documentElement.style.setProperty("--bg-color", colors.backgroundColor);
    document.documentElement.style.setProperty("--text-color", colors.textColor);
  };

  const handleApplyPreset = (theme: Theme) => {
    setCurrentTheme(theme.id);
    const colors = {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor
    };
    setCustomColors(colors);
    applyTheme(colors);
    localStorage.setItem("appTheme", JSON.stringify(colors));

    alert(userLanguage === "ar" 
      ? "تم تطبيق المظهر بنجاح!" 
      : "Theme applied successfully!");
  };

  const handleColorChange = (colorKey: keyof typeof customColors, value: string) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    setCurrentTheme("custom");
    applyTheme(newColors);
  };

  const handleSaveCustom = () => {
    localStorage.setItem("appTheme", JSON.stringify(customColors));
    alert(userLanguage === "ar" 
      ? "تم حفظ المظهر المخصص!" 
      : "Custom theme saved!");
  };

  const handleResetToDefault = () => {
    const defaultTheme = presetThemes[0];
    handleApplyPreset(defaultTheme);
  };

  return (
    <>
      <Navigation />
      <main style={{
        direction: isRTL ? "rtl" : "ltr",
        minHeight: "100vh",
        backgroundColor: customColors.backgroundColor,
        padding: "40px 20px",
      }}>
        <section style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            textAlign: "center",
            marginBottom: "50px",
          }}>
            <h1 style={{
              fontSize: "42px",
              color: customColors.primaryColor,
              marginBottom: "15px",
            }}>
              🎨 {userLanguage === "ar" ? "تخصيص المظهر" : "Theme Customization"}
            </h1>
            <p style={{
              fontSize: "18px",
              color: "#666",
            }}>
              {userLanguage === "ar"
                ? "اختر مظهراً مسبقاً أو أنشئ مظهراً مخصصاً بألوانك المفضلة"
                : "Choose a preset or create a custom theme"}
            </p>
          </div>

          {/* Preset Themes Grid */}
          <div style={{
            marginBottom: "50px",
          }}>
            <h2 style={{
              fontSize: "28px",
              color: customColors.primaryColor,
              marginBottom: "25px",
            }}>
              {userLanguage === "ar" ? "🖼️ المظاهر المسبقة" : "🖼️ Preset Themes"}
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "20px",
            }}>
              {presetThemes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => handleApplyPreset(theme)}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "0.3s",
                    border: currentTheme === theme.id ? `3px solid ${theme.primaryColor}` : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)")}
                >
                  {/* Color Preview */}
                  <div style={{
                    display: "flex",
                    height: "80px",
                  }}>
                    <div style={{
                      flex: 1,
                      backgroundColor: theme.primaryColor,
                    }} />
                    <div style={{
                      flex: 1,
                      backgroundColor: theme.secondaryColor,
                    }} />
                    <div style={{
                      flex: 1,
                      backgroundColor: theme.accentColor,
                    }} />
                  </div>

                  {/* Theme Info */}
                  <div style={{
                    padding: "15px",
                  }}>
                    <h3 style={{
                      fontSize: "16px",
                      color: theme.primaryColor,
                      margin: "0 0 10px 0",
                      fontWeight: "bold",
                    }}>
                      {userLanguage === "ar" ? theme.nameAr : theme.nameEn}
                    </h3>

                    <button
                      style={{
                        width: "100%",
                        padding: "8px",
                        backgroundColor: theme.primaryColor,
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {userLanguage === "ar" ? "تطبيق" : "Apply"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Theme Editor */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}>
            <h2 style={{
              fontSize: "28px",
              color: customColors.primaryColor,
              marginBottom: "30px",
            }}>
              {userLanguage === "ar" ? "🎨 محرر المظهر المخصص" : "🎨 Custom Theme Editor"}
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "30px",
            }}>
              {/* Color Picker */}
              {[
                { key: "primaryColor", label: userLanguage === "ar" ? "اللون الأساسي" : "Primary Color" },
                { key: "secondaryColor", label: userLanguage === "ar" ? "اللون الثانوي" : "Secondary Color" },
                { key: "accentColor", label: userLanguage === "ar" ? "اللون البارز" : "Accent Color" },
                { key: "backgroundColor", label: userLanguage === "ar" ? "لون الخلفية" : "Background Color" },
                { key: "textColor", label: userLanguage === "ar" ? "لون النص" : "Text Color" }
              ].map((color) => (
                <div key={color.key}>
                  <label style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: customColors.primaryColor,
                    marginBottom: "10px",
                  }}>
                    {color.label}
                  </label>

                  <div style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}>
                    <input
                      type="color"
                      value={customColors[color.key as keyof typeof customColors]}
                      onChange={(e) => handleColorChange(color.key as any, e.target.value)}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                      }}
                    />

                    <input
                      type="text"
                      value={customColors[color.key as keyof typeof customColors]}
                      onChange={(e) => handleColorChange(color.key as any, e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                        fontSize: "12px",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex",
              gap: "10px",
              marginTop: "30px",
              flexWrap: "wrap",
            }}>
              <button
                onClick={handleSaveCustom}
                style={{
                  flex: 1,
                  minWidth: "150px",
                  padding: "12px",
                  backgroundColor: customColors.secondaryColor,
                  color: customColors.primaryColor,
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {userLanguage === "ar" ? "💾 حفظ المظهر" : "💾 Save Theme"}
              </button>

              <button
                onClick={handleResetToDefault}
                style={{
                  flex: 1,
                  minWidth: "150px",
                  padding: "12px",
                  backgroundColor: "#ddd",
                  color: "#666",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {userLanguage === "ar" ? "🔄 إعادة تعيين" : "🔄 Reset"}
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}>
            <h2 style={{
              fontSize: "28px",
              color: customColors.primaryColor,
              marginBottom: "30px",
            }}>
              {userLanguage === "ar" ? "👁️ معاينة" : "👁️ Preview"}
            </h2>

            {/* Sample Components */}
            <div style={{
              display: "grid",
              gap: "20px",
            }}>
              {/* Sample Button */}
              <div>
                <p style={{ color: customColors.textColor, marginBottom: "10px", fontWeight: "bold" }}>
                  {userLanguage === "ar" ? "زر العينة" : "Sample Button"}
                </p>
                <button
                  style={{
                    padding: "12px 24px",
                    backgroundColor: customColors.secondaryColor,
                    color: customColors.primaryColor,
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {userLanguage === "ar" ? "اضغط هنا" : "Click Here"}
                </button>
              </div>

              {/* Sample Card */}
              <div style={{
                backgroundColor: customColors.backgroundColor,
                borderRadius: "8px",
                padding: "20px",
                border: `2px solid ${customColors.accentColor}`,
              }}>
                <h3 style={{
                  color: customColors.primaryColor,
                  margin: "0 0 10px 0",
                }}>
                  {userLanguage === "ar" ? "بطاقة العينة" : "Sample Card"}
                </h3>
                <p style={{
                  color: customColors.textColor,
                  margin: "0",
                  lineHeight: "1.5",
                }}>
                  {userLanguage === "ar"
                    ? "هذه بطاقة عينة تعرض كيفية ظهور المظهر الخاص بك على الموقع"
                    : "This is a sample card showing how your theme will look on the site"}
                </p>
              </div>

              {/* Sample Header */}
              <div style={{
                backgroundColor: customColors.primaryColor,
                color: customColors.backgroundColor,
                padding: "30px",
                borderRadius: "8px",
                textAlign: "center",
              }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>
                  {userLanguage === "ar" ? "رأس الصفحة" : "Page Header"}
                </h2>
                <p style={{ margin: "0" }}>
                  {userLanguage === "ar" ? "عنوان العينة" : "Sample Heading"}
                </p>
              </div>

              {/* Color Palette */}
              <div>
                <p style={{ color: customColors.textColor, marginBottom: "10px", fontWeight: "bold" }}>
                  {userLanguage === "ar" ? "لوحة الألوان" : "Color Palette"}
                </p>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "10px",
                }}>
                  {[
                    { color: customColors.primaryColor, label: "Primary" },
                    { color: customColors.secondaryColor, label: "Secondary" },
                    { color: customColors.accentColor, label: "Accent" },
                    { color: customColors.backgroundColor, label: "Background" },
                    { color: customColors.textColor, label: "Text" }
                  ].map((item) => (
                    <div key={item.label} style={{ textAlign: "center" }}>
                      <div
                        style={{
                          width: "100%",
                          height: "60px",
                          backgroundColor: item.color,
                          borderRadius: "6px",
                          marginBottom: "8px",
                          border: "1px solid #ddd",
                        }}
                      />
                      <p style={{
                        fontSize: "12px",
                        color: customColors.textColor,
                        margin: "0",
                      }}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
