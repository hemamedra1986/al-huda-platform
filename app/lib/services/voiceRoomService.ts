/**
 * خدمة غرف الصوت المتقدمة
 * توفر واجهات لإدارة المكالمات والمشاركين
 */

export interface VoiceParticipant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
  language: string;
}

export interface VoiceRoom {
  id: string;
  name: string;
  description: string;
  host: string;
  maxParticipants: number;
  currentParticipants: VoiceParticipant[];
  createdAt: Date;
  startedAt?: Date;
  isRecording: boolean;
  language: string;
  enableTranslation: boolean;
}

/**
 * إدارة جودة الصوت
 */
export const audioQualitySettings = {
  hd: { bitrate: 128, sampleRate: 48000, label: 'عالية جدًا' },
  high: { bitrate: 96, sampleRate: 48000, label: 'عالية' },
  normal: { bitrate: 64, sampleRate: 44100, label: 'عادية' },
  low: { bitrate: 32, sampleRate: 16000, label: 'منخفضة' }
};

/**
 * الحصول على إعدادات الجودة بناءً على سرعة الإنترنت
 */
export function getOptimalAudioQuality(bandwidth: number): keyof typeof audioQualitySettings {
  if (bandwidth > 256) return 'hd';
  if (bandwidth > 150) return 'high';
  if (bandwidth > 64) return 'normal';
  return 'low';
}

/**
 * إنشاء غرفة صوت جديدة
 */
export function createVoiceRoom(name: string, description: string, host: string): VoiceRoom {
  return {
    id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    host,
    maxParticipants: 50,
    currentParticipants: [],
    createdAt: new Date(),
    isRecording: false,
    language: 'ar',
    enableTranslation: true
  };
}

/**
 * إضافة مشارك إلى الغرفة
 */
export function addParticipant(room: VoiceRoom, participant: VoiceParticipant): VoiceRoom {
  if (room.currentParticipants.length >= room.maxParticipants) {
    throw new Error('الغرفة ممتلئة');
  }
  
  return {
    ...room,
    currentParticipants: [...room.currentParticipants, participant]
  };
}

/**
 * إزالة مشارك من الغرفة
 */
export function removeParticipant(room: VoiceRoom, participantId: string): VoiceRoom {
  return {
    ...room,
    currentParticipants: room.currentParticipants.filter(p => p.id !== participantId)
  };
}

/**
 * تبديل حالة الميوت للمشارك
 */
export function toggleMute(room: VoiceRoom, participantId: string): VoiceRoom {
  return {
    ...room,
    currentParticipants: room.currentParticipants.map(p =>
      p.id === participantId ? { ...p, isMuted: !p.isMuted } : p
    )
  };
}

/**
 * تحديث حالة التحدث (للأيقونات البصرية)
 */
export function updateSpeakingStatus(
  room: VoiceRoom,
  participantId: string,
  isSpeaking: boolean
): VoiceRoom {
  return {
    ...room,
    currentParticipants: room.currentParticipants.map(p =>
      p.id === participantId ? { ...p, isSpeaking } : p
    )
  };
}

/**
 * بدء تسجيل الاجتماع
 */
export function startRecording(room: VoiceRoom): VoiceRoom {
  return {
    ...room,
    isRecording: true,
    startedAt: new Date()
  };
}

/**
 * إيقاف التسجيل
 */
export function stopRecording(room: VoiceRoom): { room: VoiceRoom; recordingDuration: number } {
  const duration = room.startedAt ? Date.now() - room.startedAt.getTime() : 0;
  return {
    room: { ...room, isRecording: false },
    recordingDuration: Math.floor(duration / 1000) // بالثواني
  };
}

/**
 * الحصول على إحصائيات الغرفة
 */
export function getRoomStats(room: VoiceRoom) {
  return {
    totalParticipants: room.currentParticipants.length,
    mutedParticipants: room.currentParticipants.filter(p => p.isMuted).length,
    speakingParticipants: room.currentParticipants.filter(p => p.isSpeaking).length,
    isRecording: room.isRecording,
    duration: room.startedAt ? Math.floor((Date.now() - room.startedAt.getTime()) / 1000) : 0,
    capacity: `${room.currentParticipants.length}/${room.maxParticipants}`
  };
}
