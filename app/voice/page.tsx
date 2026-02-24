"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useEffect } from "react";
import { 
  VoiceRoom, 
  createVoiceRoom,
  getRoomStats,
  audioQualitySettings,
  getOptimalAudioQuality,
  removeParticipant,
  toggleMute
} from "@/app/lib/services/voiceRoomService";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";
import { translateText } from "@/app/lib/services/advancedTranslationService";
import {
  createVoiceCallNotification,
  updateVoiceCallStatus,
} from "@/app/lib/services/firestoreService";
import { getOrCreateGuestSession } from "@/app/lib/services/guestSessionService";

export default function VoicePage() {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [isMuted, setIsMuted] = useState(false);
  const [audioQuality, setAudioQuality] = useState<keyof typeof audioQualitySettings>('normal');
  const [isLoading, setIsLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    const initLocation = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);
      setIsLoading(false);
    };
    initLocation();

    const guest = getOrCreateGuestSession();
    setUserId(guest.userId);

    // محاكاة غرف صوتية متاحة
    const mockRooms = [
      createVoiceRoom('🌙 درس الليل الحي', 'درس ديني مباشر كل ليلة', 'الشيخ أحمد'),
      createVoiceRoom('📚 تدارس القرآن', 'جلسة تدارس القرآن الكريم', 'د. فاطمة'),
      createVoiceRoom('💬 حوار مفتوح', 'نقاش حر في قضايا إسلامية معاصرة', 'الشيخ محمد'),
      createVoiceRoom('🎤 أسئلة وأجوبة', 'اطرح أسئلتك على العلماء', 'فريق المنصة')
    ];

    setRooms(mockRooms);
  }, []);

  const handleJoinRoom = async (room: VoiceRoom) => {
    setActiveRoom(room);
    setConnectionStatus('connecting');
    setTimeout(() => setConnectionStatus('connected'), 1500);

    // Notify admin via Firestore in real-time
    try {
      const guestId = userId || getOrCreateGuestSession().userId;
      const docRef = await createVoiceCallNotification({
        userId: guestId,
        roomName: room.name,
        roomDescription: room.description,
      });
      setActiveCallId(docRef.id);
    } catch (err) {
      // Non-critical: continue even if Firestore notification fails
      console.warn("Could not notify admin of voice call:", err);
    }
  };

  const handleLeaveRoom = async () => {
    if (activeCallId) {
      try {
        await updateVoiceCallStatus(activeCallId, "ended");
      } catch (err) {
        console.warn("Could not update voice call status:", err);
      }
      setActiveCallId(null);
    }
    setActiveRoom(null);
    setConnectionStatus('disconnected');
    setRecordingTime(0);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleCreateRoom = async () => {
    if (newRoomName.trim()) {
      const newRoom = createVoiceRoom(newRoomName, 'غرفة صوتية جديدة', 'أنت');
      setRooms([...rooms, newRoom]);
      setNewRoomName('');
      setShowNewRoom(false);
    }
  };

  const isRTL = userLanguage === "ar";

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "50px" }}>⏳ جاري التحميل...</div>;
  }

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
          maxWidth: "1400px",
          margin: "0 auto",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
            flexWrap: "wrap",
            gap: "20px",
          }}>
            <div>
              <h1 style={{
                fontSize: "36px",
                color: "#1a3a52",
                margin: 0,
              }}>
                🌐 {isRTL ? 'الغرف الصوتية المباشرة' : 'Live Voice Rooms'}
              </h1>
              <p style={{
                fontSize: "16px",
                color: "#666",
                margin: "10px 0 0 0",
              }}>
                {isRTL 
                  ? 'محادثات مباشرة مع ترجمة فورية وتفاعل حي'
                  : 'Live conversations with instant translation'}
              </p>
            </div>

            <button
              onClick={() => setShowNewRoom(true)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#ffd700",
                color: "#1a3a52",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffed4e")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
            >
              ➕ {isRTL ? 'إنشاء غرفة' : 'Create Room'}
            </button>
          </div>

          {/* قائمة الغرف المتاحة */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "25px",
            marginBottom: "40px",
          }}>
            {rooms.map((room) => {
              const stats = getRoomStats(room);
              const isActive = activeRoom?.id === room.id;

              return (
                <div
                  key={room.id}
                  onClick={() => !isActive && handleJoinRoom(room)}
                  style={{
                    backgroundColor: isActive ? "#e8f5e9" : "white",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: isActive
                      ? "0 8px 16px rgba(0,0,0,0.15)"
                      : "0 4px 8px rgba(0,0,0,0.1)",
                    cursor: isActive ? "default" : "pointer",
                    border: isActive ? "2px solid #4caf50" : "2px solid transparent",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                    }
                  }}
                >
                  <h3 style={{
                    fontSize: "18px",
                    color: "#1a3a52",
                    margin: "0 0 8px 0",
                  }}>
                    {room.name}
                  </h3>

                  <p style={{
                    fontSize: "14px",
                    color: "#666",
                    margin: "0 0 15px 0",
                  }}>
                    {room.description}
                  </p>

                  {/* معلومات الغرفة */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "15px",
                    paddingBottom: "15px",
                    borderBottom: "1px solid #eee",
                  }}>
                    <div style={{
                      fontSize: "13px",
                      color: "#666",
                    }}>
                      <strong>👥 {isRTL ? 'المشاركون' : 'Participants'}</strong>
                      <br />
                      {stats.totalParticipants}/{room.maxParticipants}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "#666",
                    }}>
                      <strong>🎤 {isRTL ? 'الحالة' : 'Status'}</strong>
                      <br />
                      {isActive ? '✅ متصل' : '⏳ متاحة'}
                    </div>
                  </div>

                  <button
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: isActive ? "#ff6b6b" : "#ffd700",
                      color: isActive ? "white" : "#1a3a52",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "0.3s",
                    }}
                  >
                    {isActive
                      ? (isRTL ? '🔴 مكالمة جارية' : '🔴 In Call')
                      : (isRTL ? '🟢 الانضمام' : '🟢 Join')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* واجهة المكالمة النشطة */}
          {activeRoom && (
            <div style={{
              position: "fixed",
              bottom: "20px",
              right: isRTL ? "20px" : "auto",
              left: isRTL ? "auto" : "20px",
              width: "380px",
              maxWidth: "calc(100% - 40px)",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              zIndex: 1000,
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}>
                <h3 style={{
                  margin: 0,
                  color: "#1a3a52",
                  fontSize: "14px",
                }}>
                  {activeRoom.name}
                </h3>
                <button
                  onClick={handleLeaveRoom}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* حالة الاتصال */}
              <div style={{
                padding: "8px",
                backgroundColor: connectionStatus === 'connected' ? "#e8f5e9" : "#fff3e0",
                borderRadius: "6px",
                marginBottom: "12px",
                fontSize: "12px",
                color: connectionStatus === 'connected' ? "#2e7d32" : "#f57c00",
              }}>
                {connectionStatus === 'connected' ? '✅ متصل' : '🔄 جاري الاتصال...'}
              </div>

              {/* أزرار التحكم */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "10px",
              }}>
                <button
                  onClick={handleToggleMute}
                  style={{
                    padding: "8px",
                    backgroundColor: isMuted ? "#ff6b6b" : "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {isMuted ? '🔇' : '🎤'}
                </button>
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  style={{
                    padding: "8px",
                    backgroundColor: showTranslation ? "#2196F3" : "#666",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  🌐
                </button>
              </div>

              <button
                onClick={handleLeaveRoom}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "#ff6b6b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "11px",
                }}
              >
                {isRTL ? 'مغادرة' : 'Leave'}
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
