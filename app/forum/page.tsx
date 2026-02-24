"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useEffect } from "react";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";

interface ForumPost {
  id: number;
  authorName: string;
  authorEmail: string;
  title: string;
  content: string;
  category: "discussion" | "suggestion" | "question" | "announcement";
  date: string;
  replies: number;
  views: number;
  votes: number;
}

interface Reply {
  id: number;
  postId: number;
  authorName: string;
  content: string;
  date: string;
  votes: number;
}

export default function ForumPage() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [activeTab, setActiveTab] = useState<"all" | "discussion" | "suggestion" | "question">("all");
  const [posts, setPosts] = useState<ForumPost[]>([
    {
      id: 1,
      authorName: "أحمد محمد",
      authorEmail: "ahmed@example.com",
      title: "كيفية تحسين المنصة؟",
      content: "أعتقد أنه يمكننا إضافة ميزة تقييم المشايخ والمعلمين لتحسين جودة الخدمة",
      category: "suggestion",
      date: "2025-02-20",
      replies: 5,
      views: 45,
      votes: 12
    },
    {
      id: 2,
      authorName: "فاطمة علي",
      authorEmail: "fatima@example.com",
      title: "مناقشة: الأساليب الفعالة في التعلم الذاتي",
      content: "يود أن أفتح نقاش حول أفضل الطرق لتطوير الذات والتعليم المستمر من خلال المنصة",
      category: "discussion",
      date: "2025-02-19",
      replies: 8,
      views: 78,
      votes: 24
    },
    {
      id: 3,
      authorName: "محمود أحمد",
      authorEmail: "mahmoud@example.com",
      title: "سؤال: هل توجد دورات في إدارة المال الإسلامية؟",
      content: "هل توجد دورات متخصصة في إدارة وتنمية المال وفق الشريعة الإسلامية؟",
      category: "question",
      date: "2025-02-18",
      replies: 3,
      views: 32,
      votes: 7
    }
  ]);

  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<Reply[]>([
    {
      id: 1,
      postId: 1,
      authorName: "مريم حسن",
      content: "فكرة رائعة! يمكننا أيضاً إضافة نظام نقاط وشارات للمشاركين النشطين",
      date: "2025-02-21",
      votes: 8
    }
  ]);

  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "discussion" as const,
    authorName: "",
    authorEmail: ""
  });

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [newReply, setNewReply] = useState({
    authorName: "",
    content: ""
  });

  const isRTL = userLanguage === "ar";

  useEffect(() => {
    const initLanguage = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);
    };
    initLanguage();
  }, []);

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, { ar: string; en: string; color: string }> = {
      discussion: { ar: "💬 مناقشة", en: "💬 Discussion", color: "#2196F3" },
      suggestion: { ar: "💡 اقتراح", en: "💡 Suggestion", color: "#4CAF50" },
      question: { ar: "❓ سؤال", en: "❓ Question", color: "#FF9800" },
      announcement: { ar: "📢 إعلان", en: "📢 Announcement", color: "#f44336" }
    };
    return categories[category] || categories.discussion;
  };

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content || !newPost.authorName || !newPost.authorEmail) {
      alert(userLanguage === "ar" ? "الرجاء ملء جميع الحقول" : "Please fill all fields");
      return;
    }

    const post: ForumPost = {
      id: Math.max(...posts.map(p => p.id), 0) + 1,
      ...newPost,
      date: new Date().toISOString().split('T')[0],
      replies: 0,
      views: 1,
      votes: 0
    };

    setPosts([post, ...posts]);
    setNewPost({ title: "", content: "", category: "discussion", authorName: "", authorEmail: "" });
    setShowNewPostForm(false);

    alert(userLanguage === "ar" 
      ? "تم نشر موضوعك بنجاح!" 
      : "Your post has been published successfully!");
  };

  const handleAddReply = () => {
    if (!newReply.authorName || !newReply.content || !selectedPost) {
      alert(userLanguage === "ar" ? "الرجاء ملء الحقول" : "Please fill all fields");
      return;
    }

    const reply: Reply = {
      id: Math.max(...replies.map(r => r.id), 0) + 1,
      postId: selectedPost.id,
      authorName: newReply.authorName,
      content: newReply.content,
      date: new Date().toISOString().split('T')[0],
      votes: 0
    };

    setReplies([...replies, reply]);
    setPosts(posts.map(p => 
      p.id === selectedPost.id
        ? { ...p, replies: p.replies + 1 }
        : p
    ));

    setNewReply({ authorName: "", content: "" });
    setShowReplyForm(false);
  };

  const filteredPosts = activeTab === "all" 
    ? posts 
    : posts.filter(p => p.category === activeTab);

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
          maxWidth: "1000px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            flexWrap: "wrap",
            gap: "15px",
          }}>
            <div>
              <h1 style={{
                fontSize: "36px",
                color: "#1a3a52",
                marginBottom: "5px",
              }}>
                💬 {userLanguage === "ar" ? "منتدى النقاش" : "Discussion Forum"}
              </h1>
              <p style={{
                color: "#666",
                margin: "0",
              }}>
                {userLanguage === "ar"
                  ? "شارك أفكارك واقتراحاتك مع المجتمع"
                  : "Share your ideas and suggestions with the community"}
              </p>
            </div>
            <button
              onClick={() => setShowNewPostForm(true)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#ffd700",
                color: "#1a3a52",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffed4e")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
            >
              {userLanguage === "ar" ? "📝 موضوع جديد" : "📝 New Post"}
            </button>
          </div>

          {/* Filters */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "30px",
            borderBottom: "2px solid #ddd",
            flexWrap: "wrap",
          }}>
            {(["all", "discussion", "suggestion", "question"] as const).map((tab) => (
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
                {tab === "all" && (userLanguage === "ar" ? "الكل" : "All")}
                {tab !== "all" && getCategoryLabel(tab)[isRTL ? "ar" : "en"]}
              </button>
            ))}
          </div>

          {/* Posts List */}
          {!selectedPost ? (
            <div style={{
              display: "grid",
              gap: "15px",
            }}>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      padding: "20px",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "0.3s",
                      borderRight: `4px solid ${getCategoryLabel(post.category).color}`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)")}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}>
                      <div>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          backgroundColor: getCategoryLabel(post.category).color,
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          marginBottom: "8px",
                        }}>
                          {getCategoryLabel(post.category)[isRTL ? "ar" : "en"]}
                        </span>
                        <h3 style={{
                          fontSize: "18px",
                          color: "#1a3a52",
                          margin: "0 0 5px 0",
                        }}>
                          {post.title}
                        </h3>
                        <p style={{
                          color: "#666",
                          fontSize: "14px",
                          margin: "0",
                        }}>
                          {userLanguage === "ar" ? "بواسطة" : "By"} <strong>{post.authorName}</strong> •{" "}
                          {post.date}
                        </p>
                      </div>
                    </div>

                    <p style={{
                      color: "#666",
                      margin: "15px 0",
                      lineHeight: "1.5",
                    }}>
                      {post.content.substring(0, 150)}...
                    </p>

                    <div style={{
                      display: "flex",
                      gap: "20px",
                      fontSize: "12px",
                      color: "#999",
                    }}>
                      <span>👁️ {post.views} {userLanguage === "ar" ? "مشاهدة" : "views"}</span>
                      <span>💬 {post.replies} {userLanguage === "ar" ? "رد" : "replies"}</span>
                      <span>👍 {post.votes} {userLanguage === "ar" ? "تصويت" : "votes"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#999",
                }}>
                  {userLanguage === "ar" ? "لا توجد مواضيع في هذه الفئة" : "No posts in this category"}
                </div>
              )}
            </div>
          ) : (
            /* Post Detail View */
            <div>
              <button
                onClick={() => setSelectedPost(null)}
                style={{
                  marginBottom: "20px",
                  padding: "10px 20px",
                  backgroundColor: "#ddd",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ← {userLanguage === "ar" ? "العودة" : "Back"}
              </button>

              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "30px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                marginBottom: "30px",
              }}>
                <span style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  backgroundColor: getCategoryLabel(selectedPost.category).color,
                  color: "white",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "15px",
                }}>
                  {getCategoryLabel(selectedPost.category)[isRTL ? "ar" : "en"]}
                </span>

                <h1 style={{
                  fontSize: "32px",
                  color: "#1a3a52",
                  marginBottom: "15px",
                }}>
                  {selectedPost.title}
                </h1>

                <div style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "20px",
                  color: "#666",
                  fontSize: "14px",
                  flexWrap: "wrap",
                }}>
                  <span>✍️ {selectedPost.authorName}</span>
                  <span>📅 {selectedPost.date}</span>
                  <span>👁️ {selectedPost.views} {userLanguage === "ar" ? "مشاهدة" : "views"}</span>
                  <span>👍 {selectedPost.votes} {userLanguage === "ar" ? "تصويت" : "votes"}</span>
                </div>

                <div style={{
                  borderTop: "1px solid #eee",
                  borderBottom: "1px solid #eee",
                  padding: "20px 0",
                  marginBottom: "20px",
                  lineHeight: "1.8",
                  color: "#333",
                  fontSize: "16px",
                }}>
                  {selectedPost.content}
                </div>

                <div style={{
                  display: "flex",
                  gap: "10px",
                }}>
                  <button style={{
                    padding: "10px 20px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}>
                    👍 {userLanguage === "ar" ? "أعجب" : "Vote"}
                  </button>
                  <button style={{
                    padding: "10px 20px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}>
                    🔔 {userLanguage === "ar" ? "متابعة" : "Follow"}
                  </button>
                </div>
              </div>

              {/* Replies */}
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "30px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                marginBottom: "30px",
              }}>
                <h2 style={{
                  fontSize: "24px",
                  color: "#1a3a52",
                  marginBottom: "20px",
                }}>
                  💬 {userLanguage === "ar" ? "الردود" : "Replies"} ({replies.filter(r => r.postId === selectedPost.id).length})
                </h2>

                {replies.filter(r => r.postId === selectedPost.id).map((reply) => (
                  <div
                    key={reply.id}
                    style={{
                      padding: "15px",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "6px",
                      marginBottom: "15px",
                      borderRight: "3px solid #ffd700",
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}>
                      <strong style={{ color: "#1a3a52" }}>{reply.authorName}</strong>
                      <span style={{ color: "#999", fontSize: "12px" }}>{reply.date}</span>
                    </div>
                    <p style={{
                      margin: "0 0 10px 0",
                      color: "#333",
                      lineHeight: "1.5",
                    }}>
                      {reply.content}
                    </p>
                    <button style={{
                      padding: "4px 12px",
                      backgroundColor: "transparent",
                      color: "#666",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}>
                      👍 {reply.votes}
                    </button>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {!showReplyForm ? (
                <button
                  onClick={() => setShowReplyForm(true)}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#ffd700",
                    color: "#1a3a52",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffed4e")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
                >
                  {userLanguage === "ar" ? "📝 أضف رد" : "📝 Add Reply"}
                </button>
              ) : (
                <div style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "20px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}>
                  <input
                    type="text"
                    placeholder={userLanguage === "ar" ? "اسمك" : "Your name"}
                    value={newReply.authorName}
                    onChange={(e) => setNewReply({ ...newReply, authorName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      marginBottom: "15px",
                      boxSizing: "border-box",
                    }}
                  />
                  <textarea
                    placeholder={userLanguage === "ar" ? "محتوى الرد..." : "Reply content..."}
                    value={newReply.content}
                    onChange={(e) => setNewReply({ ...newReply, content: e.target.value })}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      marginBottom: "15px",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                  <div style={{
                    display: "flex",
                    gap: "10px",
                  }}>
                    <button
                      onClick={handleAddReply}
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor: "#ffd700",
                        color: "#1a3a52",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {userLanguage === "ar" ? "إرسال الرد" : "Post Reply"}
                    </button>
                    <button
                      onClick={() => setShowReplyForm(false)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor: "#ddd",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {userLanguage === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Post Modal */}
          {showNewPostForm && (
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
                padding: "30px",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
              }}>
                <h2 style={{
                  fontSize: "24px",
                  color: "#1a3a52",
                  marginBottom: "20px",
                }}>
                  {userLanguage === "ar" ? "📝 موضوع جديد" : "📝 New Post"}
                </h2>

                <input
                  type="text"
                  placeholder={userLanguage === "ar" ? "اسمك" : "Your name"}
                  value={newPost.authorName}
                  onChange={(e) => setNewPost({ ...newPost, authorName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    marginBottom: "15px",
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="email"
                  placeholder={userLanguage === "ar" ? "بريدك الإلكتروني" : "Your email"}
                  value={newPost.authorEmail}
                  onChange={(e) => setNewPost({ ...newPost, authorEmail: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    marginBottom: "15px",
                    boxSizing: "border-box",
                  }}
                />

                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value as any })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    marginBottom: "15px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="discussion">{userLanguage === "ar" ? "💬 مناقشة" : "💬 Discussion"}</option>
                  <option value="suggestion">{userLanguage === "ar" ? "💡 اقتراح" : "💡 Suggestion"}</option>
                  <option value="question">{userLanguage === "ar" ? "❓ سؤال" : "❓ Question"}</option>
                </select>

                <input
                  type="text"
                  placeholder={userLanguage === "ar" ? "عنوان الموضوع" : "Post title"}
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    marginBottom: "15px",
                    boxSizing: "border-box",
                    fontSize: "16px",
                  }}
                />

                <textarea
                  placeholder={userLanguage === "ar" ? "محتوى الموضوع..." : "Post content..."}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    marginBottom: "15px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />

                <div style={{
                  display: "flex",
                  gap: "10px",
                }}>
                  <button
                    onClick={handleCreatePost}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "#ffd700",
                      color: "#1a3a52",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {userLanguage === "ar" ? "نشر الموضوع" : "Publish"}
                  </button>
                  <button
                    onClick={() => setShowNewPostForm(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "#ddd",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {userLanguage === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
